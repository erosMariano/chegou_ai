import { Injectable } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import { PackageStatus } from "@prisma/client"

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
}

