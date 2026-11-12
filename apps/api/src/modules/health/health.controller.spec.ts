import { describe, it, expect, vi } from "vitest"
import { HttpStatus } from "@nestjs/common"
import { HealthController } from "./health.controller"

function createMockResponse() {
  const res: any = {
    statusCode: 0,
    body: null,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
  }
  return res
}

describe("HealthController", () => {
  it("deve retornar 200 OK quando PostgreSQL, Redis e RabbitMQ estão saudáveis", async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]) } as any
    const redis = { ping: vi.fn().mockResolvedValue(true) } as any
    const rabbitmq = { isConnected: vi.fn().mockReturnValue(true) } as any

    const controller = new HealthController(prisma, redis, rabbitmq)
    const res = createMockResponse()

    await controller.check(res)

    expect(res.statusCode).toBe(HttpStatus.OK)
    expect(res.body).toEqual(
      expect.objectContaining({
        status: "ok",
        services: {
          database: "up",
          redis: "up",
          rabbitmq: "up",
        },
      })
    )
  })

  it("deve retornar 503 Service Unavailable quando alguma dependência essencial está indisponível", async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]) } as any
    const redis = { ping: vi.fn().mockRejectedValue(new Error("Redis connection refused")) } as any
    const rabbitmq = { isConnected: vi.fn().mockReturnValue(false) } as any

    const controller = new HealthController(prisma, redis, rabbitmq)
    const res = createMockResponse()

    await controller.check(res)

    expect(res.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE)
    expect(res.body).toEqual(
      expect.objectContaining({
        status: "degraded",
        services: {
          database: "up",
          redis: "down",
          rabbitmq: "down",
        },
      })
    )
  })
})

