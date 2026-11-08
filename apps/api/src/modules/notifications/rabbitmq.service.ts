import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as amqp from "amqplib"

export const PACKAGE_EXCHANGE = "chegou.packages.exchange"
export const PACKAGE_RECEIVED_QUEUE = "chegou.package.received.queue"
export const PACKAGE_DLQ = "chegou.package.received.dlq"

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

  private async connect() {
    try {
      const url = this.config.get<string>("RABBITMQ_URL") || "amqp://guest:guest@localhost:5672"
      this.connection = await amqp.connect(url)
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

      this.logger.log("✅ Conexão com RabbitMQ e filas (incluindo DLQ) inicializadas.")
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

        try {
          const content = JSON.parse(msg.content.toString())
          const success = await callback(content)
          if (success) {
            this.channel.ack(msg)
          } else {
            // Reenvia para DLQ após falha
            this.channel.nack(msg, false, false)
          }
        } catch (e: any) {
          this.logger.error(`Erro ao processar mensagem do RabbitMQ: ${e.message}`)
          this.channel.nack(msg, false, false)
        }
      },
      { noAck: false }
    )
  }
}

