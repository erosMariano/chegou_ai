import { Controller, Get, Query, UseGuards, Res } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiProduces } from "@nestjs/swagger"
import { AuditService } from "./audit.service"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { RolesGuard } from "@/common/guards/roles.guard"
import { Roles } from "@/common/decorators/roles.decorator"
import { UserRole } from "@prisma/client"

@ApiTags("Audit")
@ApiBearerAuth("JWT-auth")
@Controller("audit")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get("events")
  @ApiOperation({ summary: "Trilha imutável de eventos de custódia", description: "Retorna o histórico append-only de eventos de pacotes (CREATED, NOTIFIED, DELIVERED, CANCELLED). Exclusivo para ADMIN." })
  @ApiQuery({ name: "eventType", required: false, description: "Filtro por tipo de evento (ex: CREATED, DELIVERED, CANCELLED)" })
  @ApiQuery({ name: "packageId", required: false, description: "Filtro por ID da encomenda" })
  @ApiResponse({ status: 200, description: "Trilha de eventos retornada com sucesso." })
  async getEvents(
    @Query("eventType") eventType?: string,
    @Query("packageId") packageId?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    const res = await this.auditService.findAllEvents({ eventType, packageId, page, limit })
    if (!page) {
      return res.items
    }
    return res
  }

  @Get("export")
  @ApiOperation({ summary: "Exportação de relatório CSV de auditoria", description: "Gera arquivo CSV para download com higienização contra CSV Injection." })
  @ApiProduces("text/csv")
  @ApiResponse({ status: 200, description: "Download do arquivo CSV com eventos de custódia." })
  async exportCsv(@Res() res: any) {
    const csv = await this.auditService.exportCsv()
    res.setHeader("Content-Type", "text/csv; charset=utf-8")
    res.setHeader("Content-Disposition", 'attachment; filename="auditoria-chegou-ai.csv"')
    return res.send(csv)
  }

  @Get("metrics")
  @ApiOperation({ summary: "Métricas operacionais e SLAs do condomínio", description: "Retorna totais de encomendas recebidas hoje, entregues hoje, pendentes e histórico geral." })
  @ApiResponse({ status: 200, description: "Métricas retornadas com sucesso." })
  async getMetrics() {
    return this.auditService.getMetrics()
  }
}
