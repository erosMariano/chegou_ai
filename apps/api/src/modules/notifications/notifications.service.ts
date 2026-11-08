import { Injectable, OnModuleInit, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PrismaService } from "@/prisma/prisma.service"
import { RabbitMQService } from "./rabbitmq.service"
import * as webpush from "web-push"
import { PackageStatus } from "@prisma/client"

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly rabbitmq: RabbitMQService
  ) {}

  onModuleInit() {
    this.configureVapid()
    this.startWorker()
  }

  private configureVapid() {
    const publicKey = this.config.get<string>("NEXT_PUBLIC_VAPID_PUBLIC_KEY")
    const privateKey = this.config.get<string>("VAPID_PRIVATE_KEY")
    const subject = this.config.get<string>("VAPID_SUBJECT") || "mailto:contato@chegou.ai"

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey)
      this.logger.log("✅ VAPID Keys configuradas para Web Push.")
    } else {
      this.logger.warn("⚠️ Chaves VAPID não configuradas no .env. Notificações reais serão simuladas nos logs.")
    }
  }

  private async startWorker() {
    await this.rabbitmq.consumePackageReceived(async (payload) => {
      this.logger.log(`📦 Processando notificação para o pacote ${payload.packageId} (Unidade ${payload.block}-${payload.number})...`)
      return this.sendNotificationToUnitResidents(payload)
    })
  }

  async sendNotificationToUnitResidents(payload: {
    packageId: string
    unitId: string
    block: string
    number: string
    recipientName: string
    carrier?: string
    pickupPin: string
  }): Promise<boolean> {
    try {
      // 1. Buscar moradores da unidade com suas inscrições push válidas
      const residents = await this.prisma.resident.findMany({
        where: { unitId: payload.unitId },
        include: {
          pushSubscriptions: {
            where: { isValid: true },
          },
        },
      })

      const allSubscriptions = residents.flatMap((r) => r.pushSubscriptions)

      let pushDeliveredCount = 0

      const pushPayload = JSON.stringify({
        title: "📦 Sua encomenda chegou!",
        body: `Olá! Chegou uma entrega de ${payload.carrier || "Transportadora"} para a unidade ${payload.block}-${payload.number}. PIN: ${payload.pickupPin}`,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        data: {
          packageId: payload.packageId,
          url: "/morador",
          pin: payload.pickupPin,
        },
      })

      // 2. Disparar push para cada inscrição encontrada
      for (const sub of allSubscriptions) {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dhKey,
              auth: sub.authKey,
            },
          }
          await webpush.sendNotification(pushSubscription, pushPayload)
          pushDeliveredCount++
        } catch (pushErr: any) {
          this.logger.warn(`Falha no envio push para endpoint ${sub.endpoint.substring(0, 30)}...: ${pushErr.message}`)
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            // Inscrição expirada / cancelada pelo usuário
            await this.prisma.pushSubscription.update({
              where: { id: sub.id },
              data: { isValid: false },
            })
          }
        }
      }

      const success = allSubscriptions.length === 0 || pushDeliveredCount > 0

      // 3. Atualizar status do pacote no banco
      const finalStatus = success ? PackageStatus.NOTIFIED : PackageStatus.NOTIFICATION_FAILED

      const pkgExists = await this.prisma.package.findUnique({
        where: { id: payload.packageId },
      })

      if (pkgExists) {
        await this.prisma.package.update({
          where: { id: payload.packageId },
          data: {
            status: finalStatus,
            notifiedAt: new Date(),
          },
        })

        // 4. Registrar evento de auditoria
        await this.prisma.packageEvent.create({
          data: {
            packageId: payload.packageId,
            eventType: success ? "PUSH_SENT" : "PUSH_FAILED",
            metadata: {
              totalSubscriptions: allSubscriptions.length,
              deliveredCount: pushDeliveredCount,
              carrier: payload.carrier,
            },
          },
        })
      }

      this.logger.log(`✅ Notificação do pacote ${payload.packageId} concluída com status: ${finalStatus}`)
      return true
    } catch (e: any) {
      this.logger.error(`❌ Erro no processamento de notificações: ${e.message}`)
      return false
    }
  }
}

