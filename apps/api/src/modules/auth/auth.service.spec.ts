import { describe, it, expect, vi, beforeEach } from "vitest"
import { ConflictException, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { JwtService } from "@nestjs/jwt"
import { AuthService } from "./auth.service"
import { PrismaService } from "@/prisma/prisma.service"
import { RedisService } from "@/common/redis/redis.service"
import { MailService } from "@/common/mail/mail.service"

describe("AuthService (Unit)", () => {
  let service: AuthService
  let prisma: any
  let redis: any
  let mail: any
  let jwtService: any
  let config: any

  beforeEach(() => {
    prisma = {
      user: { findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
    }
    redis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      setIfNotExists: vi.fn(),
    }
    mail = {
      sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
    }
    jwtService = { sign: vi.fn().mockReturnValue("jwt-token") }
    config = { get: vi.fn().mockReturnValue("http://localhost:3000") }

    service = new AuthService(
      prisma as PrismaService,
      jwtService as JwtService,
      redis as RedisService,
      config as ConfigService,
      mail as MailService
    )
  })

  it("deve retornar resposta idêntica e sem resetToken/resetUrl para e-mail existente ou inexistente", async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null)
    const missingRes = await service.forgotPassword("naoexiste@chegou.ai")

    prisma.user.findUnique.mockResolvedValueOnce({
      id: "u-1",
      name: "Síndico",
      email: "sindico@chegou.ai",
    })
    const existingRes = await service.forgotPassword("sindico@chegou.ai")

    expect(missingRes).toEqual(existingRes)
    expect(existingRes).not.toHaveProperty("resetToken")
    expect(existingRes).not.toHaveProperty("resetUrl")
    expect(redis.set).toHaveBeenCalledTimes(1)
    expect(mail.sendPasswordResetEmail).toHaveBeenCalledTimes(1)
  })

  it("deve rejeitar token inválido ou expirado no resetPassword", async () => {
    redis.get.mockResolvedValue(null)

    await expect(
      service.resetPassword("sindico@chegou.ai", "token-invalido", "NovaSenha@123")
    ).rejects.toThrow(UnauthorizedException)
  })

  it("deve invalidar o token no Redis após uso bem-sucedido no resetPassword", async () => {
    redis.get.mockResolvedValue("token-valido")
    prisma.user.findUnique.mockResolvedValue({ id: "u-1", email: "sindico@chegou.ai" })

    const res = await service.resetPassword("sindico@chegou.ai", "token-valido", "NovaSenha@123")

    expect(res.success).toBe(true)
    expect(prisma.user.update).toHaveBeenCalledTimes(1)
    expect(redis.del).toHaveBeenCalledWith("auth:reset_token:sindico@chegou.ai")
  })

  it("deve rejeitar setupInitialAdmin concorrente quando lock distribuído já estiver ocupado", async () => {
    redis.setIfNotExists.mockResolvedValue(false)

    await expect(
      service.setupInitialAdmin({
        condominiumName: "Condo",
        name: "Admin",
        email: "admin@chegou.ai",
        password: "Password@123",
      })
    ).rejects.toThrow(ConflictException)
  })
})

