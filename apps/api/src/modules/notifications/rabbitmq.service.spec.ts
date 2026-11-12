import { describe, it, expect, vi, beforeEach } from "vitest"
import { ConfigService } from "@nestjs/config"
import {
  RabbitMQService,
  PACKAGE_RETRY_LEVELS,
  MAX_PACKAGE_RETRIES,
} from "./rabbitmq.service"

describe("RabbitMQService (Política de Retry e DLQ)", () => {
  let service: RabbitMQService
  let mockChannel: {
    ack: ReturnType<typeof vi.fn>
    nack: ReturnType<typeof vi.fn>
    sendToQueue: ReturnType<typeof vi.fn>
    consume: ReturnType<typeof vi.fn>
  }
  let registeredHandler: (msg: any) => Promise<void>

  beforeEach(async () => {
    const config = { get: vi.fn().mockReturnValue("amqp://localhost:5672") } as unknown as ConfigService
    service = new RabbitMQService(config)

    mockChannel = {
      ack: vi.fn(),
      nack: vi.fn(),
      sendToQueue: vi.fn().mockReturnValue(true),
      consume: vi.fn(async (_queue: string, handler: (msg: any) => Promise<void>) => {
        registeredHandler = handler
      }),
    }

    ;(service as any).connection = {}
    ;(service as any).channel = mockChannel
  })

  it("deve agendar retry na fila de 5s com x-retry-count=1 quando o callback falhar na 1ª tentativa", async () => {
    await service.consumePackageReceived(async () => false)

    const msg = {
      content: Buffer.from(JSON.stringify({ packageId: "pkg-1" })),
      properties: { headers: {} },
    }
    await registeredHandler(msg)

    expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
      PACKAGE_RETRY_LEVELS[0].queue,
      msg.content,
      expect.objectContaining({
        persistent: true,
        headers: expect.objectContaining({ "x-retry-count": 1 }),
      })
    )
    expect(mockChannel.ack).toHaveBeenCalledWith(msg)
    expect(mockChannel.nack).not.toHaveBeenCalled()
  })

  it("deve enviar para a DLQ (nack sem requeue) após esgotar as 3 tentativas de retry", async () => {
    await service.consumePackageReceived(async () => {
      throw new Error("Push gateway timeout")
    })

    const msg = {
      content: Buffer.from(JSON.stringify({ packageId: "pkg-2" })),
      properties: { headers: { "x-retry-count": MAX_PACKAGE_RETRIES } },
    }
    await registeredHandler(msg)

    expect(mockChannel.sendToQueue).not.toHaveBeenCalled()
    expect(mockChannel.nack).toHaveBeenCalledWith(msg, false, false)
    expect(mockChannel.ack).not.toHaveBeenCalled()
  })

  it("deve enviar JSON malformado direto para a DLQ sem agendar retries", async () => {
    await service.consumePackageReceived(async () => true)

    const msg = {
      content: Buffer.from("{json-invalido"),
      properties: { headers: {} },
    }
    await registeredHandler(msg)

    expect(mockChannel.sendToQueue).not.toHaveBeenCalled()
    expect(mockChannel.nack).toHaveBeenCalledWith(msg, false, false)
  })
})

