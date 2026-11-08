import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import { RedisService } from "@/common/redis/redis.service"
import { RabbitMQService } from "@/modules/notifications/rabbitmq.service"
import * as bcrypt from "bcryptjs"
import { PackageStatus } from "@prisma/client"
import { randomUUID } from "crypto"

import { CreatePackageDto, CheckoutPackageDto } from "./dto/package.dto"

export { CreatePackageDto, CheckoutPackageDto }

@Injectable()
export class PackagesService {
  private readonly logger = new Logger(PackagesService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitMQService
  ) {}

  /**
   * Check-in de nova encomenda com Idempotência via Redis
   */
  async createPackage(
    dto: CreatePackageDto,
    idempotencyKey: string | undefined,
    registeredByUserId: string
  ) {
    // 1. Verificação de idempotência no Redis
    if (idempotencyKey) {
      const redisKey = `idempotency:package:${idempotencyKey}`
      const cached = await this.redis.get(redisKey)
      if (cached) {
        this.logger.log(`Idempotency hit para chave: ${idempotencyKey}`)
        return JSON.parse(cached)
      }
    }

    // 2. Validação da Unidade
    const unit = await this.prisma.unit.findUnique({
      where: { id: dto.unitId },
    })

    if (!unit) {
      throw new BadRequestException(`Unidade ${dto.unitId} não encontrada.`)
    }

    // 3. Geração de PIN (6 dígitos numéricos) e QR Token (UUID)
    const rawPin = Math.floor(100000 + Math.random() * 900000).toString()
    const pinHash = await bcrypt.hash(rawPin, 10)
    const qrToken = randomUUID()

    // 4. Criação atômica no banco de dados
    const pkg = await this.prisma.$transaction(async (tx) => {
      const created = await tx.package.create({
        data: {
          unitId: dto.unitId,
          registeredByUserId,
          recipientNameRaw: dto.recipientNameRaw.trim(),
          trackingCode: dto.trackingCode?.trim() || null,
          carrier: dto.carrier?.trim() || null,
          pickupPin: rawPin,
          pickupPinHash: pinHash,
          pickupQrToken: qrToken,
          status: PackageStatus.RECEIVED,
          aiConfidenceScore: dto.aiConfidenceScore ? Number(dto.aiConfidenceScore) : null,
          version: 1,
        },
        include: {
          unit: true,
        },
      })

      await tx.packageEvent.create({
        data: {
          packageId: created.id,
          actorUserId: registeredByUserId,
          eventType: "CREATED",
          metadata: {
            carrier: dto.carrier,
            trackingCode: dto.trackingCode,
            confidenceScore: dto.aiConfidenceScore,
          },
        },
      })

      return created
    })

    // 5. Publicação assíncrona no RabbitMQ para notificação push
    await this.rabbitmq.publishPackageReceived({
      packageId: pkg.id,
      unitId: unit.id,
      block: unit.block,
      number: unit.number,
      recipientName: pkg.recipientNameRaw,
      carrier: pkg.carrier || undefined,
      pickupPin: rawPin,
    })

    const response = {
      id: pkg.id,
      status: pkg.status,
      unit: {
        id: unit.id,
        block: unit.block,
        number: unit.number,
      },
      recipientNameRaw: pkg.recipientNameRaw,
      carrier: pkg.carrier,
      trackingCode: pkg.trackingCode,
      pickupQrToken: pkg.pickupQrToken,
      receivedAt: pkg.receivedAt.toISOString(),
      aiConfidenceScore: pkg.aiConfidenceScore ? Number(pkg.aiConfidenceScore) : null,
    }

    // 6. Cache de idempotência por 24 horas
    if (idempotencyKey) {
      const redisKey = `idempotency:package:${idempotencyKey}`
      await this.redis.set(redisKey, JSON.stringify(response), 86400)
    }

    return response
  }

  /**
   * Check-out de encomenda via PIN ou QR Token com Optimistic Locking e Rate Limiting
   */
  async checkoutPackage(dto: CheckoutPackageDto, actorUserId: string) {
    const rawCode = dto.code.trim()

    // 1. Rate limiting de tentativas de PIN no Redis (5 tentativas em 5 min)
    if (dto.codeType === "PIN") {
      const rateLimitKey = `ratelimit:pin_checkout:${actorUserId}`
      const attempts = await this.redis.incrementWithTtl(rateLimitKey, 300)
      if (attempts > 15) {
        throw new ConflictException("Muitas tentativas incorretas de retirada. Aguarde 5 minutos.")
      }
    }

    let targetPackage: any = null

    // 2. Busca da encomenda
    if (dto.codeType === "QR") {
      targetPackage = await this.prisma.package.findFirst({
        where: { pickupQrToken: rawCode },
        include: { unit: true },
      })
    } else {
      // Otimização e Prevenção contra DoS de CPU (Bcrypt Loop):
      // Se packageId for informado, lookup direto O(1) com apenas 1 verificação de hash
      if (dto.packageId) {
        const pkg = await this.prisma.package.findUnique({
          where: { id: dto.packageId },
          include: { unit: true },
        })
        if (pkg && (await bcrypt.compare(rawCode, pkg.pickupPinHash))) {
          targetPackage = pkg
        }
      } else {
        const whereClause: any = {
          status: { in: [PackageStatus.RECEIVED, PackageStatus.NOTIFIED, PackageStatus.NOTIFICATION_FAILED] },
        }
        if (dto.unitId) {
          whereClause.unitId = dto.unitId
        }

        // take: 20 limita o pior caso de hashes comparados em uma única chamada
        const pendingPackages = await this.prisma.package.findMany({
          where: whereClause,
          take: 20,
          include: { unit: true },
        })

        for (const p of pendingPackages) {
          const matches = await bcrypt.compare(rawCode, p.pickupPinHash)
          if (matches) {
            targetPackage = p
            break
          }
        }
      }
    }

    // 3. Se não encontrou nenhuma encomenda pendente correspondente
    if (!targetPackage) {
      // Verifica se existe já entregue com o token QR para retornar mensagem específica
      if (dto.codeType === "QR") {
        const delivered = await this.prisma.package.findFirst({
          where: { pickupQrToken: rawCode, status: PackageStatus.DELIVERED },
        })
        if (delivered) {
          throw new ConflictException("Esta encomenda já foi retirada anteriormente.")
        }
      }
      throw new NotFoundException("Código de retirada (PIN ou QR Code) inválido ou encomenda não encontrada.")
    }

    if (targetPackage.status === PackageStatus.DELIVERED) {
      throw new ConflictException("Esta encomenda já teve sua baixa registrada.")
    }

    if (targetPackage.status === PackageStatus.CANCELLED) {
      throw new ConflictException("Esta encomenda foi cancelada.")
    }

    // 4. Baixa atômica com Optimistic Locking
    const updated = await this.prisma.$transaction(async (tx) => {
      // Atualização condicional pelo version atual
      const count = await tx.package.updateMany({
        where: {
          id: targetPackage.id,
          version: targetPackage.version,
          status: { in: [PackageStatus.RECEIVED, PackageStatus.NOTIFIED, PackageStatus.NOTIFICATION_FAILED] },
        },
        data: {
          status: PackageStatus.DELIVERED,
          deliveredAt: new Date(),
          deliveredToResidentId: dto.residentId || null,
          version: { increment: 1 },
        },
      })

      if (count.count === 0) {
        throw new ConflictException("Conflito de concorrência: a encomenda foi alterada por outro terminal.")
      }

      await tx.packageEvent.create({
        data: {
          packageId: targetPackage.id,
          actorUserId,
          eventType: "DELIVERED",
          metadata: {
            method: dto.codeType,
            residentId: dto.residentId || null,
          },
        },
      })

      return tx.package.findUnique({
        where: { id: targetPackage.id },
        include: { unit: true },
      })
    })

    return {
      success: true,
      message: `Encomenda entregue com sucesso para a unidade Bloco ${updated.unit.block} - ${updated.unit.number}.`,
      packageId: updated.id,
      status: updated.status,
      unit: `Bloco ${updated.unit.block} - ${updated.unit.number}`,
      recipientName: updated.recipientNameRaw,
      carrier: updated.carrier,
      deliveredAt: updated.deliveredAt?.toISOString(),
      packageItem: {
        id: updated.id,
        unitId: updated.unitId,
        recipientNameRaw: updated.recipientNameRaw,
        trackingCode: updated.trackingCode,
        carrier: updated.carrier,
        status: updated.status,
        pickupQrToken: updated.pickupQrToken,
        receivedAt: updated.receivedAt.toISOString(),
        deliveredAt: updated.deliveredAt?.toISOString(),
        unit: {
          id: updated.unit.id,
          block: updated.unit.block,
          number: updated.unit.number,
        },
      },
    }
  }

  /**
   * Listagem paginada de encomendas com filtros
   */
  async findAll(params: {
    status?: PackageStatus | "PENDING"
    unitId?: string
    search?: string
    page?: number
    limit?: number
    isResident?: boolean
  }) {
    const page = Math.max(Number(params.page) || 1, 1)
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100)
    const skip = (page - 1) * limit

    const where: any = {}

    if (params.status === "PENDING") {
      where.status = { in: [PackageStatus.RECEIVED, PackageStatus.NOTIFIED, PackageStatus.NOTIFICATION_FAILED] }
    } else if (params.status) {
      where.status = params.status
    }

    if (params.unitId) {
      where.unitId = params.unitId
    }

    if (params.search) {
      const q = params.search.trim()
      where.OR = [
        { recipientNameRaw: { contains: q, mode: "insensitive" } },
        { trackingCode: { contains: q, mode: "insensitive" } },
        { carrier: { contains: q, mode: "insensitive" } },
      ]
    }

    const [items, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedAt: "desc" },
        include: {
          unit: true,
          events: {
            take: 3,
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      this.prisma.package.count({ where }),
    ])

    return {
      items: items.map((pkg) => ({
        id: pkg.id,
        unitId: pkg.unitId,
        recipientNameRaw: pkg.recipientNameRaw,
        trackingCode: pkg.trackingCode,
        carrier: pkg.carrier,
        status: pkg.status,
        // Oculta PIN para operadores/porteiros; visível apenas para o morador autenticado
        pickupPin: params.isResident ? pkg.pickupPin : undefined,
        aiConfidenceScore: pkg.aiConfidenceScore ? Number(pkg.aiConfidenceScore) : null,
        version: pkg.version,
        pickupQrToken: pkg.pickupQrToken,
        receivedAt: pkg.receivedAt.toISOString(),
        notifiedAt: pkg.notifiedAt?.toISOString() || null,
        deliveredAt: pkg.deliveredAt?.toISOString() || null,
        unit: {
          id: pkg.unit.id,
          block: pkg.unit.block,
          number: pkg.unit.number,
        },
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getOne(id: string, isResident = false) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: {
        unit: true,
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!pkg) {
      throw new NotFoundException(`Encomenda ${id} não encontrada.`)
    }

    // Sanitização de segurança: nunca expõe pickupPinHash na API; oculta pickupPin de operadores
    const { pickupPinHash, pickupPin, ...safePkg } = pkg

    return {
      ...safePkg,
      pickupPin: isResident ? pickupPin : undefined,
    }
  }
}
