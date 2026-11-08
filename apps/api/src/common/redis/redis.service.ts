import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import Redis from "ioredis"

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis
  private readonly logger = new Logger(RedisService.name)

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>("REDIS_URL") || "redis://localhost:6379"
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 100, 3000)
      },
    })

    this.client.on("connect", () => this.logger.log("✅ Conectado ao Redis com sucesso."))
    this.client.on("error", (err) => this.logger.error("❌ Erro no cliente Redis:", err.message))
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect()
    }
  }

  getClient(): Redis {
    return this.client
  }

  /**
   * Salva uma chave com expiração em segundos (SETEX)
   */
  async set(key: string, value: string, ttlSeconds = 86400): Promise<void> {
    await this.client.set(key, value, "EX", ttlSeconds)
  }

  /**
   * Obtém o valor de uma chave
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  /**
   * Idempotência atômica: retorna true se a chave foi setada agora pela 1ª vez
   */
  async setIfNotExists(key: string, value: string, ttlSeconds = 86400): Promise<boolean> {
    const res = await this.client.set(key, value, "EX", ttlSeconds, "NX")
    return res === "OK"
  }

  /**
   * Incrementa contador com expiração (útil para rate limiting de tentativas de PIN)
   */
  async incrementWithTtl(key: string, ttlSeconds = 300): Promise<number> {
    const multi = this.client.multi()
    multi.incr(key)
    multi.expire(key, ttlSeconds)
    const results = await multi.exec()
    return results ? (results[0][1] as number) : 1
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }
}

