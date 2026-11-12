import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PrismaService } from "@/prisma/prisma.service"
import { RedisService } from "@/common/redis/redis.service"
import { MailService } from "@/common/mail/mail.service"
import { UserRole } from "@prisma/client"
import * as bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { CreateResidentDto } from "./dto/create-resident.dto"

export { CreateResidentDto }

@Injectable()
export class ResidentsService {
  private readonly logger = new Logger(ResidentsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly mailService: MailService
  ) {}

  async findAll(unitId?: string) {
    const where = unitId ? { unitId } : {}
    return this.prisma.resident.findMany({
      where,
      orderBy: { fullName: "asc" },
      include: {
        unit: {
          select: {
            id: true,
            block: true,
            number: true,
          },
        },
      },
    })
  }

  async findOne(id: string) {
    const resident = await this.prisma.resident.findUnique({
      where: { id },
      include: {
        unit: true,
      },
    })

    if (!resident) {
      throw new NotFoundException(`Morador com id ${id} não encontrado.`)
    }

    return resident
  }

  async create(data: CreateResidentDto) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: data.unitId },
    })

    if (!unit) {
      throw new BadRequestException(`Unidade com id ${data.unitId} não existe.`)
    }

    const normalizedEmail = data.email.toLowerCase().trim()

    // Proteção de Privilégio (SEC-25): impede que contas administrativas (ADMIN / PORTER) sejam rebaixadas
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    })
    if (existingUser && existingUser.role !== UserRole.RESIDENT) {
      throw new ConflictException(
        `O e-mail ${normalizedEmail} já pertence a uma conta de acesso ${existingUser.role} e não pode ser cadastrado como morador.`
      )
    }

    const resident = await this.prisma.resident.create({
      data: {
        unitId: data.unitId,
        fullName: data.fullName.trim(),
        email: normalizedEmail,
        phone: data.phone?.trim() || null,
        documentLast4: data.documentLast4?.trim() || null,
        isPrimary: data.isPrimary ?? false,
      },
      include: {
        unit: true,
      },
    })

    // Inicializa conta de usuário associada com status pendente de ativação (isActive: false)
    const initialPlaceholderHash = await bcrypt.hash(randomBytes(16).toString("hex"), 10)
    await this.prisma.user.upsert({
      where: { email: resident.email },
      update: {
        name: resident.fullName,
        unitId: resident.unitId,
      },
      create: {
        name: resident.fullName,
        email: resident.email,
        passwordHash: initialPlaceholderHash,
        role: UserRole.RESIDENT,
        unitId: resident.unitId,
        isActive: false,
      },
    })

    // Dispara automaticamente convite e e-mail via Resend para ativação da conta
    try {
      await this.generateInvite(resident.id, true)
    } catch (err: any) {
      this.logger.warn(`Não foi possível enviar e-mail de convite no cadastro do morador: ${err.message}`)
    }

    return resident
  }

  async update(id: string, data: Partial<CreateResidentDto>) {
    const current = await this.findOne(id)

    let normalizedEmail: string | undefined
    if (data.email) {
      normalizedEmail = data.email.toLowerCase().trim()
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      })
      if (existingUser && existingUser.role !== UserRole.RESIDENT) {
        throw new ConflictException(
          `O e-mail ${normalizedEmail} pertence a uma conta de acesso ${existingUser.role} e não pode ser transferido.`
        )
      }
    }

    const updated = await this.prisma.resident.update({
      where: { id },
      data: {
        ...(data.fullName ? { fullName: data.fullName.trim() } : {}),
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
        ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
        ...(data.documentLast4 !== undefined ? { documentLast4: data.documentLast4?.trim() || null } : {}),
        ...(data.isPrimary !== undefined ? { isPrimary: data.isPrimary } : {}),
        ...(data.unitId ? { unitId: data.unitId } : {}),
      },
      include: {
        unit: true,
      },
    })

    if (data.email || data.fullName || data.unitId) {
      await this.prisma.user.updateMany({
        where: { email: current.email, role: UserRole.RESIDENT },
        data: {
          name: updated.fullName,
          email: updated.email,
          unitId: updated.unitId,
        },
      })
    }

    return updated
  }

  async delete(id: string) {
    const res = await this.findOne(id)
    await this.prisma.user.deleteMany({
      where: { email: res.email, role: UserRole.RESIDENT },
    })
    return this.prisma.resident.delete({
      where: { id },
    })
  }

  async savePushSubscription(residentId: string, data: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string }) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      update: {
        residentId,
        p256dhKey: data.keys.p256dh,
        authKey: data.keys.auth,
        userAgent: data.userAgent || null,
        isValid: true,
        lastUsedAt: new Date(),
      },
      create: {
        residentId,
        endpoint: data.endpoint,
        p256dhKey: data.keys.p256dh,
        authKey: data.keys.auth,
        userAgent: data.userAgent || null,
        isValid: true,
      },
    })
  }

  async getResidentPackages(residentEmail: string, status?: string) {
    const resident = await this.prisma.resident.findFirst({
      where: { email: residentEmail },
    })

    if (!resident) {
      return { items: [] }
    }

    const where: any = {
      unitId: resident.unitId,
    }

    if (status === "PENDING") {
      where.status = { in: ["RECEIVED", "NOTIFIED", "NOTIFICATION_FAILED"] }
    } else if (status) {
      where.status = status
    }

    const packages = await this.prisma.package.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      include: {
        unit: true,
      },
    })

    return {
      items: packages.map((pkg) => ({
        id: pkg.id,
        carrier: pkg.carrier,
        trackingCode: pkg.trackingCode,
        recipientNameRaw: pkg.recipientNameRaw,
        status: pkg.status,
        pickupPin: pkg.pickupPin,
        pickupQrToken: pkg.pickupQrToken,
        receivedAt: pkg.receivedAt.toISOString(),
        notifiedAt: pkg.notifiedAt?.toISOString() || null,
        deliveredAt: pkg.deliveredAt?.toISOString() || null,
        unit: {
          block: pkg.unit.block,
          number: pkg.unit.number,
        },
      })),
    }
  }

  async importBatch(items: Array<{
    block?: string
    number: string
    fullName: string
    email: string
    phone?: string
    isPrimary?: boolean
  }>) {
    if (!Array.isArray(items) || items.length === 0) {
      return { totalReceived: 0, created: 0, errors: [] }
    }

    const units = await this.prisma.unit.findMany({ where: { isActive: true } })
    const unitMap = new Map<string, string>()
    for (const u of units) {
      unitMap.set(`${u.block.toUpperCase().trim()}:${u.number.trim()}`, u.id)
    }

    let created = 0
    const errors: string[] = []

    for (let index = 0; index < items.length; index++) {
      const row = items[index]
      const block = (row.block || "UNICO").toUpperCase().trim()
      const number = (row.number || "").trim()
      const key = `${block}:${number}`

      let targetUnitId = unitMap.get(key)
      if (!targetUnitId) {
        try {
          const newUnit = await this.prisma.unit.create({
            data: { block, number, isActive: true },
          })
          targetUnitId = newUnit.id
          unitMap.set(key, targetUnitId)
        } catch {
          targetUnitId = unitMap.get(key)
        }
      }

      if (!targetUnitId) {
        errors.push(`Linha ${index + 1}: Unidade ${block}-${number} inválida`)
        continue
      }

      const email = (row.email || "").toLowerCase().trim()
      const fullName = (row.fullName || "").trim()

      if (!email || !fullName) {
        errors.push(`Linha ${index + 1}: Nome e e-mail são obrigatórios`)
        continue
      }

      try {
        const existingPrivilegedUser = await this.prisma.user.findUnique({
          where: { email },
          select: { role: true },
        })
        if (existingPrivilegedUser && existingPrivilegedUser.role !== UserRole.RESIDENT) {
          errors.push(`Linha ${index + 1} (${fullName}): e-mail pertence a uma conta ${existingPrivilegedUser.role}`)
          continue
        }

        await this.prisma.resident.create({
          data: {
            unitId: targetUnitId,
            fullName,
            email,
            phone: row.phone?.trim() || null,
            isPrimary: row.isPrimary || false,
          },
        })
        created++
      } catch (err: any) {
        errors.push(`Linha ${index + 1} (${fullName}): ${err.message}`)
      }
    }

    return {
      totalReceived: items.length,
      created,
      errors,
    }
  }

  getTemplateCsv() {
    return "bloco,numero,nome_completo,email,telefone,principal\nB,402,Mariana Costa Silva,mariana@exemplo.com,(11) 98765-4321,sim\nA,101,João da Silva,joao@exemplo.com,(11) 91234-5678,nao\n"
  }

  async generateInvite(residentId: string, sendEmail = true) {
    const resident = await this.findOne(residentId)
    const token = randomBytes(32).toString("hex")
    const normalizedEmail = resident.email.toLowerCase().trim()
    await this.redis.set(`auth:invite_token:${normalizedEmail}`, token, 604800) // 7 dias de validade

    const appUrl =
      this.config.get<string>("FRONTEND_URL") ||
      this.config.get<string>("NEXT_PUBLIC_APP_URL") ||
      "http://localhost:3000"
    const cleanAppUrl = appUrl.trim().replace(/\/+$/, "")
    const inviteUrl = `${cleanAppUrl}/ativar-conta?token=${token}&email=${encodeURIComponent(normalizedEmail)}`

    if (sendEmail) {
      const unitInfo = resident.unit
        ? `Bloco ${resident.unit.block} - Apto ${resident.unit.number}`
        : "Condomínio"

      this.mailService
        .sendResidentInviteEmail({
          to: resident.email,
          residentName: resident.fullName,
          unitInfo,
          inviteUrl,
        })
        .catch((err) => {
          this.logger.error(`Falha ao despachar e-mail via Resend: ${err.message}`)
        })
    }

    return {
      token,
      inviteUrl,
      resident: {
        id: resident.id,
        fullName: resident.fullName,
        email: resident.email,
        unit: resident.unit,
      },
    }
  }
}

