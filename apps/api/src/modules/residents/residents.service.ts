import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import { UserRole } from "@prisma/client"
import * as bcrypt from "bcryptjs"
import { CreateResidentDto } from "./dto/create-resident.dto"

export { CreateResidentDto }

@Injectable()
export class ResidentsService {
  constructor(private readonly prisma: PrismaService) {}

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

    const resident = await this.prisma.resident.create({
      data: {
        unitId: data.unitId,
        fullName: data.fullName.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone?.trim() || null,
        documentLast4: data.documentLast4?.trim() || null,
        isPrimary: data.isPrimary ?? false,
      },
      include: {
        unit: true,
      },
    })

    // Sincroniza usuário operacional para o morador poder logar
    const defaultPasswordHash = await bcrypt.hash("123456", 10)
    await this.prisma.user.upsert({
      where: { email: resident.email },
      update: {
        name: resident.fullName,
        unitId: resident.unitId,
        role: UserRole.RESIDENT,
        isActive: true,
      },
      create: {
        name: resident.fullName,
        email: resident.email,
        passwordHash: defaultPasswordHash,
        role: UserRole.RESIDENT,
        unitId: resident.unitId,
        isActive: true,
      },
    })

    return resident
  }

  async update(id: string, data: Partial<CreateResidentDto>) {
    await this.findOne(id)

    const updated = await this.prisma.resident.update({
      where: { id },
      data: {
        ...(data.fullName ? { fullName: data.fullName.trim() } : {}),
        ...(data.email ? { email: data.email.toLowerCase().trim() } : {}),
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
        where: { email: updated.email },
        data: {
          name: updated.fullName,
          unitId: updated.unitId,
        },
      })
    }

    return updated
  }

  async delete(id: string) {
    const res = await this.findOne(id)
    await this.prisma.user.deleteMany({
      where: { email: res.email },
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
}

