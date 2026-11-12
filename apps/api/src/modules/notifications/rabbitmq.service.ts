import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as amqp from "amqplib"

export const PACKAGE_EXCHANGE = "chegou.packages.exchange"
export const PACKAGE_RECEIVED_QUEUE = "chegou.package.received.queue"
export const PACKAGE_DLQ = "chegou.package.received.dlq"
export const PACKAGE_RETRY_LEVELS = [
  { queue: "chegou.package.received.retry.1", ttlMs: 5_000 },
  { queue: "chegou.package.received.retry.2", ttlMs: 15_000 },
  { queue: "chegou.package.received.retry.3", ttlMs: 45_000 },
] as const
export const MAX_PACKAGE_RETRIES = PACKAGE_RETRY_LEVELS.length

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: any = null
  private channel: any = null
  private connectPromise: Promise<void> | null = null
  private readonly logger = new Logger(RabbitMQService.name)

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.connectPromise = this.connect()
    await this.connectPromise
  }

  private async ensureConnected() {
    if (this.connectPromise) {
      await this.connectPromise
    }
    if (!this.channel) {
      this.connectPromise = this.connect()
      await this.connectPromise
    }
  }

  async onModuleDestroy() {
    try {
      if (this.channel) await this.channel.close()
      if (this.connection) await this.connection.close()
    } catch (e: any) {
      this.logger.warn(`Erro ao fechar conexão com RabbitMQ: ${e.message}`)
    }
  }

  isConnected(): boolean {
    return Boolean(this.connection && this.channel)
  }

  private async connect() {
    try {
      const url = this.config.get<string>("RABBITMQ_URL") || "amqp://guest:guest@localhost:5672"
      this.connection = await amqp.connect(url)
      this.connection.on("close", () => {
        this.channel = null
        this.connection = null
      })
      this.connection.on("error", (err: any) => {
        this.logger.warn(`Erro na conexão RabbitMQ: ${err.message}`)
      })
      this.channel = await this.connection.createChannel()

      // Configuração da DLQ
      await this.channel.assertQueue(PACKAGE_DLQ, { durable: true })

      // Configuração da fila principal com Dead Letter Exchange
      await this.channel.assertQueue(PACKAGE_RECEIVED_QUEUE, {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": "",
          "x-dead-letter-routing-key": PACKAGE_DLQ,
          "x-message-ttl": 86400000, // 24h
        },
      })

      // Filas de retry com backoff (TTL expira e reencaminha para a fila principal)
      for (const level of PACKAGE_RETRY_LEVELS) {
        await this.channel.assertQueue(level.queue, {
          durable: true,
          arguments: {
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": PACKAGE_RECEIVED_QUEUE,
            "x-message-ttl": level.ttlMs,
          },
        })
      }

      this.logger.log("✅ Conexão com RabbitMQ, filas de retry e DLQ inicializadas.")
    } catch (err: any) {
      this.logger.error(`❌ Erro ao conectar ao RabbitMQ: ${err.message}`)
    }
  }

  async publishPackageReceived(payload: {
    packageId: string
    unitId: string
    block: string
    number: string
    recipientName: string
    carrier?: string
    pickupPin: string
  }) {
    await this.ensureConnected()
    if (!this.channel) {
      this.logger.warn("Canal do RabbitMQ não disponível para publicação.")
      return false
    }

    const messageBuffer = Buffer.from(JSON.stringify(payload))
    return this.channel.sendToQueue(PACKAGE_RECEIVED_QUEUE, messageBuffer, {
      persistent: true,
    })
  }

  async consumePackageReceived(callback: (payload: any) => Promise<boolean>) {
    await this.ensureConnected()
    if (!this.channel) {
      this.logger.warn("Canal do RabbitMQ não disponível para consumo.")
      return
    }

    this.logger.log("🐰 Worker do RabbitMQ registrado para consumo de encomendas recebidas.")

    await this.channel.consume(
      PACKAGE_RECEIVED_QUEUE,
      async (msg: any) => {
        if (!msg) return

        let content: any
        try {
          content = JSON.parse(msg.content.toString())
        } catch (parseErr: any) {
          this.logger.error(`Payload inválido no RabbitMQ (enviando direto para DLQ): ${parseErr.message}`)
          this.channel.nack(msg, false, false)
          return
        }

        try {
          const success = await callback(content)
          if (success) {
            this.channel.ack(msg)
            return
          }
          await this.scheduleRetryOrDlq(msg, "Callback retornou false")
        } catch (e: any) {
          await this.scheduleRetryOrDlq(msg, e?.message || "Erro desconhecido")
        }
      },
      { noAck: false }
    )
  }

  private async scheduleRetryOrDlq(msg: any, reason: string) {
    const rawRetryCount = Number(msg.properties?.headers?.["x-retry-count"] ?? 0)
    const retryCount = Number.isFinite(rawRetryCount) && rawRetryCount >= 0 ? rawRetryCount : 0

    if (retryCount < MAX_PACKAGE_RETRIES) {
      const nextLevel = PACKAGE_RETRY_LEVELS[retryCount]
      const nextAttempt = retryCount + 1

      this.logger.warn(
        `⏳ Falha no consumo (${reason}). Agendando retry ${nextAttempt}/${MAX_PACKAGE_RETRIES} em ${nextLevel.ttlMs}ms na fila ${nextLevel.queue}.`
      )

      const republished = this.channel.sendToQueue(nextLevel.queue, msg.content, {
        persistent: true,
        headers: {
          ...(msg.properties?.headers || {}),
          "x-retry-count": nextAttempt,
        },
      })

      if (republished !== false) {
        this.channel.ack(msg)
        return
      }
    }

    this.logger.error(
      `❌ Máximo de ${MAX_PACKAGE_RETRIES} tentativas atingido (${reason}). Enviando mensagem para DLQ (${PACKAGE_DLQ}).`
    )
    this.channel.nack(msg, false, false)
  }
}

