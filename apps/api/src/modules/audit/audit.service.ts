import { Injectable } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import { PackageStatus } from "@prisma/client"

function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""'
  let str = String(value).trim()

  // Prevenção contra CSV / Formula Injection (DDE, Hyperlink e fórmulas maliciosas)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`
  }

  // RFC 4180: Escapar aspas duplas internas duplicando-as (" -> "")
  const escaped = str.replace(/"/g, '""')
  return `"${escaped}"`
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllEvents(params: {
    eventType?: string
    packageId?: string
    page?: number
    limit?: number
  }) {
    const page = Math.max(Number(params.page) || 1, 1)
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100)
    const skip = (page - 1) * limit

    const where: any = {}
    if (params.eventType) where.eventType = params.eventType
    if (params.packageId) where.packageId = params.packageId

    const [events, total] = await Promise.all([
      this.prisma.packageEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          package: {
            include: { unit: true },
          },
          actorUser: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
      this.prisma.packageEvent.count({ where }),
    ])

    return {
      items: events.map((e) => ({
        id: e.id,
        packageId: e.packageId,
        eventType: e.eventType,
        metadata: e.metadata,
        createdAt: e.createdAt.toISOString(),
        actor: e.actorUser
          ? { id: e.actorUser.id, name: e.actorUser.name, role: e.actorUser.role }
          : null,
        package: e.package
          ? {
              recipientNameRaw: e.package.recipientNameRaw,
              carrier: e.package.carrier,
              trackingCode: e.package.trackingCode,
              unit: `${e.package.unit.block}-${e.package.unit.number}`,
            }
          : null,
      })),
      total,
      page,
      limit,
    }
  }

  async getMetrics() {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [totalReceivedToday, totalDeliveredToday, totalPending, totalAll] = await Promise.all([
      this.prisma.package.count({
        where: { receivedAt: { gte: startOfToday } },
      }),
      this.prisma.package.count({
        where: { deliveredAt: { gte: startOfToday }, status: PackageStatus.DELIVERED },
      }),
      this.prisma.package.count({
        where: {
          status: { in: [PackageStatus.RECEIVED, PackageStatus.NOTIFIED, PackageStatus.NOTIFICATION_FAILED] },
        },
      }),
      this.prisma.package.count(),
    ])

    return {
      receivedToday: totalReceivedToday,
      deliveredToday: totalDeliveredToday,
      pending: totalPending,
      totalAll,
    }
  }

  async exportCsv() {
    const events = await this.prisma.packageEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        package: {
          include: { unit: true },
        },
        actorUser: {
          select: { name: true, role: true },
        },
      },
    })

    const header = "Data,Hora,Evento,Operador,Destinatario,Unidade,Transportadora,Rastreio\n"
    const rows = events
      .map((e) => {
        const d = new Date(e.createdAt)
        const dataStr = d.toLocaleDateString("pt-BR")
        const horaStr = d.toLocaleTimeString("pt-BR")
        const operador = e.actorUser?.name || "Sistema / Notificador"
        const dest = e.package?.recipientNameRaw || "-"
        const unidade = e.package ? `${e.package.unit.block}-${e.package.unit.number}` : "-"
        const carrier = e.package?.carrier || "-"
        const tracking = e.package?.trackingCode || "-"
        return [
          sanitizeCsvCell(dataStr),
          sanitizeCsvCell(horaStr),
          sanitizeCsvCell(e.eventType),
          sanitizeCsvCell(operador),
          sanitizeCsvCell(dest),
          sanitizeCsvCell(unidade),
          sanitizeCsvCell(carrier),
          sanitizeCsvCell(tracking),
        ].join(",")
      })
      .join("\n")

    return header + rows
  }
}

