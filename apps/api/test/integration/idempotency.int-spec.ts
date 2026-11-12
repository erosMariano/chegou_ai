import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import request from "supertest"
import { UserRole } from "@prisma/client"
import {
  TestAppContext,
  createIntegrationTestApp,
  resetTestState,
  createUnitFixture,
  createUserFixture,
  signTokenForUser,
} from "../helpers/test-app.helper"

describe("Idempotência no Check-in de Encomendas (Integração)", () => {
  let ctx: TestAppContext
  let porterToken: string
  let unitId: string

  beforeAll(async () => {
    ctx = await createIntegrationTestApp()
  })

  afterAll(async () => {
    await ctx.app.close()
  })

  beforeEach(async () => {
    await resetTestState(ctx)
    const unit = await createUnitFixture(ctx.prisma, { block: "B", number: "402" })
    const porter = await createUserFixture(ctx.prisma, { role: UserRole.PORTER })
    unitId = unit.id
    porterToken = signTokenForUser(ctx.jwtService, porter)
  })

  it("deve criar apenas 1 encomenda e retornar mesma resposta quando a mesma Idempotency-Key é enviada 2x em sequência", async () => {
    const payload = {
      unitId,
      recipientNameRaw: "Mariana Costa",
      carrier: "Amazon",
      trackingCode: "AMZ123456",
    }

    const first = await request(ctx.app.getHttpServer())
      .post("/api/v1/packages")
      .set("Authorization", `Bearer ${porterToken}`)
      .set("Idempotency-Key", "checkin-seq-001")
      .send(payload)

    const second = await request(ctx.app.getHttpServer())
      .post("/api/v1/packages")
      .set("Authorization", `Bearer ${porterToken}`)
      .set("Idempotency-Key", "checkin-seq-001")
      .send(payload)

    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
    expect(second.body.id).toBe(first.body.id)
    expect(second.body.pickupQrToken).toBe(first.body.pickupQrToken)

    const pkgCount = await ctx.prisma.package.count()
    const eventCount = await ctx.prisma.packageEvent.count({ where: { eventType: "CREATED" } })
    expect(pkgCount).toBe(1)
    expect(eventCount).toBe(1)
    expect(ctx.rabbitmq.published).toHaveLength(1)
  })

  it("deve criar 2 encomendas distintas quando Idempotency-Key diferentes são enviadas", async () => {
    const payload = { unitId, recipientNameRaw: "Mariana Costa", carrier: "Shopee" }

    const first = await request(ctx.app.getHttpServer())
      .post("/api/v1/packages")
      .set("Authorization", `Bearer ${porterToken}`)
      .set("Idempotency-Key", "checkin-diff-001")
      .send(payload)

    const second = await request(ctx.app.getHttpServer())
      .post("/api/v1/packages")
      .set("Authorization", `Bearer ${porterToken}`)
      .set("Idempotency-Key", "checkin-diff-002")
      .send(payload)

    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
    expect(first.body.id).not.toBe(second.body.id)
    expect(await ctx.prisma.package.count()).toBe(2)
  })

  // BUG CONHECIDO (TOCTOU em packages.service.ts:43-133):
  // redis.get é lido antes da transação e redis.set gravado só após a transação sem lock atômico (SET NX).
  // Requisições paralelas com a mesma Idempotency-Key passam pelo cache simultaneamente e duplicam o registro.
  it.fails(
    "deve criar apenas 1 encomenda quando a mesma Idempotency-Key é enviada em paralelo (corrida)",
    async () => {
      const payload = { unitId, recipientNameRaw: "Mariana Paralela", carrier: "Correios" }

      const responses = await Promise.all(
        Array.from({ length: 4 }).map(() =>
          request(ctx.app.getHttpServer())
            .post("/api/v1/packages")
            .set("Authorization", `Bearer ${porterToken}`)
            .set("Idempotency-Key", "checkin-race-001")
            .send(payload)
        )
      )

      expect(responses.every((r) => r.status === 201)).toBe(true)
      expect(await ctx.prisma.package.count()).toBe(1)
    }
  )
})

