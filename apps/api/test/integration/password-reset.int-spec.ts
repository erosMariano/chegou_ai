import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import request from "supertest"
import { UserRole } from "@prisma/client"
import {
  TestAppContext,
  createIntegrationTestApp,
  resetTestState,
  createUserFixture,
} from "../helpers/test-app.helper"

describe("Fluxo de Reset de Senha (Integração)", () => {
  let ctx: TestAppContext
  const targetEmail = "morador.reset@chegou.test"

  beforeAll(async () => {
    ctx = await createIntegrationTestApp()
  })

  afterAll(async () => {
    await ctx.app.close()
  })

  beforeEach(async () => {
    await resetTestState(ctx)
    await createUserFixture(ctx.prisma, {
      name: "Morador Reset",
      email: targetEmail,
      password: "SenhaAntiga@2026",
      role: UserRole.RESIDENT,
    })
  })

  it("deve concluir caminho feliz: solicitar, capturar token no e-mail, redefinir e logar com nova senha", async () => {
    const forgotRes = await request(ctx.app.getHttpServer())
      .post("/api/v1/auth/forgot-password")
      .send({ email: targetEmail })

    expect(forgotRes.status).toBe(201)
    expect(forgotRes.body).not.toHaveProperty("resetToken")
    expect(forgotRes.body).not.toHaveProperty("resetUrl")
    expect(ctx.mail.outbox).toHaveLength(1)

    const resetUrl = new URL(ctx.mail.outbox[0].url)
    const token = resetUrl.searchParams.get("token")
    expect(token).toBeTruthy()

    const resetRes = await request(ctx.app.getHttpServer())
      .post("/api/v1/auth/reset-password")
      .send({
        email: targetEmail,
        token,
        newPassword: "NovaSenha@2026",
      })

    expect(resetRes.status).toBe(201)
    expect(resetRes.body.success).toBe(true)

    const oldLogin = await request(ctx.app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: targetEmail, password: "SenhaAntiga@2026" })
    expect(oldLogin.status).toBe(401)

    const newLogin = await request(ctx.app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: targetEmail, password: "NovaSenha@2026" })
    expect(newLogin.status).toBe(201)
    expect(newLogin.body.token).toBeTruthy()
  })

  it("deve rejeitar reutilização de token já consumido (uso único)", async () => {
    await request(ctx.app.getHttpServer())
      .post("/api/v1/auth/forgot-password")
      .send({ email: targetEmail })

    const token = new URL(ctx.mail.outbox[0].url).searchParams.get("token")

    const first = await request(ctx.app.getHttpServer())
      .post("/api/v1/auth/reset-password")
      .send({ email: targetEmail, token, newPassword: "NovaSenha@2026" })
    expect(first.status).toBe(201)

    const second = await request(ctx.app.getHttpServer())
      .post("/api/v1/auth/reset-password")
      .send({ email: targetEmail, token, newPassword: "OutraSenha@2026" })
    expect(second.status).toBe(401)
  })

  it("deve rejeitar token adulterado ou expirado no Redis", async () => {
    await request(ctx.app.getHttpServer())
      .post("/api/v1/auth/forgot-password")
      .send({ email: targetEmail })

    const token = new URL(ctx.mail.outbox[0].url).searchParams.get("token")

    const tampered = await request(ctx.app.getHttpServer())
      .post("/api/v1/auth/reset-password")
      .send({ email: targetEmail, token: `${token}x`, newPassword: "NovaSenha@2026" })
    expect(tampered.status).toBe(401)

    // Simula expiração do TTL no Redis
    await ctx.redis.del(`auth:reset_token:${targetEmail}`)

    const expired = await request(ctx.app.getHttpServer())
      .post("/api/v1/auth/reset-password")
      .send({ email: targetEmail, token, newPassword: "NovaSenha@2026" })
    expect(expired.status).toBe(401)
  })

  it("deve retornar resposta idêntica (status e corpo) para e-mail existente e inexistente (anti-enumeração)", async () => {
    const existingRes = await request(ctx.app.getHttpServer())
      .post("/api/v1/auth/forgot-password")
      .send({ email: targetEmail })

    const missingRes = await request(ctx.app.getHttpServer())
      .post("/api/v1/auth/forgot-password")
      .send({ email: "desconhecido@chegou.test" })

    expect(existingRes.status).toBe(missingRes.status)
    expect(existingRes.body).toEqual(missingRes.body)
  })

  it("deve validar política mínima de senha e aplicar rate limit no endpoint forgot-password", async () => {
    const weakRes = await request(ctx.app.getHttpServer())
      .post("/api/v1/auth/reset-password")
      .send({ email: targetEmail, token: "qualquer", newPassword: "123" })
    expect(weakRes.status).toBe(400)

    // Instância isolada para garantir contador in-memory do ThrottlerGuard zerado
    const rateLimitCtx = await createIntegrationTestApp()
    try {
      const statuses: number[] = []
      for (let i = 0; i < 6; i++) {
        const r = await request(rateLimitCtx.app.getHttpServer())
          .post("/api/v1/auth/forgot-password")
          .send({ email: targetEmail })
        statuses.push(r.status)
      }
      expect(statuses.slice(0, 5).every((s) => s === 201)).toBe(true)
      expect(statuses[5]).toBe(429)
    } finally {
      await rateLimitCtx.app.close()
    }
  })

  // ACHADO DE SEGURANÇA (auth.service.ts:264):
  // O token de reset é armazenado em texto puro no Redis (auth:reset_token:<email>) em vez de hash SHA-256.
  it.fails("deve armazenar o token de reset com hash no Redis e nunca em texto puro", async () => {
    await request(ctx.app.getHttpServer())
      .post("/api/v1/auth/forgot-password")
      .send({ email: targetEmail })

    const rawToken = new URL(ctx.mail.outbox[0].url).searchParams.get("token")
    const stored = await ctx.redis.get(`auth:reset_token:${targetEmail}`)

    expect(stored).toBeTruthy()
    expect(stored).not.toBe(rawToken)
  })
})

