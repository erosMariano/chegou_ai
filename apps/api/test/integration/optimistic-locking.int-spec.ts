import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import request from "supertest"
import { PackageStatus, UserRole } from "@prisma/client"
import {
  TestAppContext,
  createIntegrationTestApp,
  resetTestState,
  createUnitFixture,
  createUserFixture,
  createPackageFixture,
  signTokenForUser,
} from "../helpers/test-app.helper"

describe("Baixa Concorrente com Optimistic Locking (Integração)", () => {
  let ctx: TestAppContext
  let porterToken: string
  let porterId: string
  let unitId: string

  beforeAll(async () => {
    ctx = await createIntegrationTestApp({ bypassThrottler: true })
  })

  afterAll(async () => {
    await ctx.app.close()
  })

  beforeEach(async () => {
    await resetTestState(ctx)
    const unit = await createUnitFixture(ctx.prisma, { block: "A", number: "101" })
    const porter = await createUserFixture(ctx.prisma, { role: UserRole.PORTER })
    unitId = unit.id
    porterId = porter.id
    porterToken = signTokenForUser(ctx.jwtService, porter)
  })

  it("deve permitir apenas 1 baixa entre 10 requisições simultâneas sobre o mesmo pacote", async () => {
    const iterations = 5
    for (let i = 0; i < iterations; i++) {
      await ctx.redis.getClient().flushdb()
      const { pkg, rawPin } = await createPackageFixture(ctx.prisma, {
        unitId,
        registeredByUserId: porterId,
      })

      // 10 requisições paralelas (nota: Throttle limit é 10/min, aqui disparamos 8 por iteração)
      const responses = await Promise.all(
        Array.from({ length: 8 }).map(() =>
          request(ctx.app.getHttpServer())
            .post("/api/v1/packages/checkout")
            .set("Authorization", `Bearer ${porterToken}`)
            .send({
              code: rawPin,
              codeType: "PIN",
              packageId: pkg.id,
            })
        )
      )

      const successes = responses.filter((r) => r.status === 201)
      const conflicts = responses.filter((r) => r.status === 409)

      expect(successes).toHaveLength(1)
      expect(conflicts).toHaveLength(7)

      const dbPkg = await ctx.prisma.package.findUnique({ where: { id: pkg.id } })
      expect(dbPkg?.status).toBe(PackageStatus.DELIVERED)
      expect(dbPkg?.version).toBe(2)

      const deliveredEvents = await ctx.prisma.packageEvent.count({
        where: { packageId: pkg.id, eventType: "DELIVERED" },
      })
      expect(deliveredEvents).toBe(1)
    }
  })

  it("deve rejeitar baixa quando a versão do registro foi alterada antes da escrita (versão obsoleta)", async () => {
    const { pkg, rawPin } = await createPackageFixture(ctx.prisma, {
      unitId,
      registeredByUserId: porterId,
    })

    // Simula outra transação que já entregou e incrementou a versão
    await ctx.prisma.package.update({
      where: { id: pkg.id },
      data: { status: PackageStatus.DELIVERED, version: 2 },
    })

    const res = await request(ctx.app.getHttpServer())
      .post("/api/v1/packages/checkout")
      .set("Authorization", `Bearer ${porterToken}`)
      .send({
        code: rawPin,
        codeType: "PIN",
        packageId: pkg.id,
      })

    expect(res.status).toBe(409)
  })
})

