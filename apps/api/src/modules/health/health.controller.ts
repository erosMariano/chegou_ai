import { Controller, Get, HttpStatus, Res } from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { SkipThrottle } from "@nestjs/throttler"
import type { Response } from "express"
import { PrismaService } from "@/prisma/prisma.service"
import { RedisService } from "@/common/redis/redis.service"
import { RabbitMQService } from "@/modules/notifications/rabbitmq.service"

type DependencyState = "up" | "down"

@ApiTags("Health")
@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitMQService
  ) {}

  @Get()
  @ApiOperation({ summary: "Verifica a saúde da API e conectividade com PostgreSQL, Redis e RabbitMQ" })
  @ApiResponse({ status: 200, description: "Todos os serviços essenciais estão operacionais" })
  @ApiResponse({ status: 503, description: "Um ou mais serviços essenciais estão indisponíveis" })
  async check(@Res() res: Response) {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()])
    const rabbitmq: DependencyState = this.rabbitmq.isConnected() ? "up" : "down"

    const allHealthy = database === "up" && redis === "up" && rabbitmq === "up"

    return res.status(allHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      status: allHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database,
        redis,
        rabbitmq,
      },
    })
  }

  private async checkDatabase(): Promise<DependencyState> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return "up"
    } catch {
      return "down"
    }
  }

  private async checkRedis(): Promise<DependencyState> {
    try {
      const ok = await this.redis.ping()
      return ok ? "up" : "down"
    } catch {
      return "down"
    }
  }
}

