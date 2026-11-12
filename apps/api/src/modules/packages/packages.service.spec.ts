import { describe, it, expect, vi, beforeEach } from "vitest"
import { ConflictException } from "@nestjs/common"
import { PackageStatus } from "@prisma/client"
import * as bcrypt from "bcryptjs"
import { PackagesService } from "./packages.service"
import { PrismaService } from "@/prisma/prisma.service"
import { RedisService } from "@/common/redis/redis.service"
import { RabbitMQService } from "@/modules/notifications/rabbitmq.service"

describe("PackagesService (Unit)", () => {
  let service: PackagesService
  let prisma: any
  let redis: any
  let rabbitmq: any

  beforeEach(() => {
    prisma = {
      unit: { findUnique: vi.fn() },
      package: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
      $transaction: vi.fn(),
    }
    redis = {
      get: vi.fn(),
      set: vi.fn(),
      incrementWithTtl: vi.fn().mockResolvedValue(1),
    }
    rabbitmq = {
      publishPackageReceived: vi.fn().mockResolvedValue(true),
    }
    service = new PackagesService(
      prisma as PrismaService,
      redis as RedisService,
      rabbitmq as RabbitMQService
    )
  })

  it("deve retornar resposta em cache e não criar novo pacote quando idempotency-key já existir", async () => {
    const cachedResponse = { id: "pkg-1", status: PackageStatus.RECEIVED }
    redis.get.mockResolvedValue(JSON.stringify(cachedResponse))

    const res = await service.createPackage(
      { unitId: "unit-1", recipientNameRaw: "Mariana Silva" },
      "idem-key-123",
      "user-1"
    )

    expect(res).toEqual(cachedResponse)
    expect(prisma.unit.findUnique).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(rabbitmq.publishPackageReceived).not.toHaveBeenCalled()
  })

  it("deve lançar ConflictException (409) no checkout quando Optimistic Locking detectar versão obsoleta", async () => {
    const pinHash = await bcrypt.hash("123456", 10)
    prisma.package.findUnique.mockResolvedValue({
      id: "pkg-1",
      unitId: "unit-1",
      status: PackageStatus.RECEIVED,
      version: 1,
      pickupPinHash: pinHash,
      unit: { id: "unit-1", block: "A", number: "101" },
    })

    prisma.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        package: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        packageEvent: { create: vi.fn() },
      }
      return cb(tx)
    })

    await expect(
      service.checkoutPackage(
        { code: "123456", codeType: "PIN", packageId: "pkg-1" },
        "porter-1"
      )
    ).rejects.toThrow(ConflictException)
  })

  it("deve bloquear cancelamento quando encomenda já estiver DELIVERED", async () => {
    prisma.package.findUnique.mockResolvedValue({
      id: "pkg-1",
      status: PackageStatus.DELIVERED,
      unit: { id: "unit-1", block: "A", number: "101" },
    })

    await expect(service.cancelPackage("pkg-1")).rejects.toThrow(ConflictException)
  })
})

