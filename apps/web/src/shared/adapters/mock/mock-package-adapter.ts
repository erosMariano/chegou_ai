import { PackagePort } from "@/shared/ports/package-port"
import {
  PackageItem,
  CheckinFormData,
  CheckoutFormData,
  ExtractLabelResponse,
  PackageEvent,
} from "@/entities/package/model/types"
import { INITIAL_PACKAGES, INITIAL_EVENTS, MOCK_UNITS } from "./mock-data"
import { generateUUID } from "@/shared/lib/utils"

class MockPackageAdapterImpl implements PackagePort {
  private packages: PackageItem[] = [...INITIAL_PACKAGES]
  private events: PackageEvent[] = [...INITIAL_EVENTS]

  async listPackages(filter?: { status?: string; unitId?: string }): Promise<PackageItem[]> {
    let result = [...this.packages]
    if (filter?.status && filter.status !== "ALL") {
      result = result.filter((pkg) => pkg.status === filter.status)
    }
    if (filter?.unitId) {
      result = result.filter((pkg) => pkg.unitId === filter.unitId)
    }
    // Most recent first
    return result.sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    )
  }

  async getPackageById(id: string): Promise<PackageItem | null> {
    const pkg = this.packages.find((p) => p.id === id)
    return pkg ? { ...pkg } : null
  }

  async getPackageByQrToken(token: string): Promise<PackageItem | null> {
    const pkg = this.packages.find((p) => p.pickupQrToken === token)
    return pkg ? { ...pkg } : null
  }

  async checkinPackage(
    data: CheckinFormData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _idempotencyKey?: string
  ): Promise<PackageItem> {
    const unit = MOCK_UNITS.find((u) => u.id === data.unitId)
    const newId = generateUUID()
    const qrToken = generateUUID()
    const pin = Math.floor(100000 + Math.random() * 900000).toString()
    const now = new Date().toISOString()

    const newPackage: PackageItem = {
      id: newId,
      unitId: data.unitId,
      recipientNameRaw: data.recipientNameRaw,
      trackingCode: data.trackingCode || `BR${Math.floor(100000000 + Math.random() * 900000000)}`,
      carrier: data.carrier || "Transportadora Local",
      pickupPin: pin,
      pickupQrToken: qrToken,
      status: "NOTIFIED",
      aiConfidenceScore: data.aiConfidenceScore ?? 0.94,
      version: 1,
      receivedAt: now,
      notifiedAt: now,
      unit: unit ? { block: unit.block, number: unit.number } : { block: "?", number: "?" },
    }

    this.packages.unshift(newPackage)

    this.events.unshift({
      id: generateUUID(),
      packageId: newId,
      actorName: "Porteiro em Turno",
      eventType: "CREATED",
      metadata: { carrier: newPackage.carrier, aiScore: newPackage.aiConfidenceScore },
      createdAt: now,
    })

    this.events.unshift({
      id: generateUUID(),
      packageId: newId,
      actorName: "RabbitMQ Push Worker",
      eventType: "PUSH_SENT",
      metadata: { resident: newPackage.recipientNameRaw, pinSent: true },
      createdAt: now,
    })

    return { ...newPackage }
  }

  async checkoutPackage(
    data: CheckoutFormData
  ): Promise<{ success: boolean; packageItem: PackageItem; message: string }> {
    const cleanCode = data.code.trim()
    const target = this.packages.find(
      (p) =>
        p.pickupPin === cleanCode ||
        p.pickupQrToken === cleanCode ||
        p.id === cleanCode ||
        p.trackingCode.toLowerCase() === cleanCode.toLowerCase()
    )

    if (!target) {
      throw new Error("Código ou token de retirada inválido. Verifique o PIN de 6 dígitos.")
    }

    if (target.status === "DELIVERED") {
      throw new Error(`Esta encomenda já foi entregue em ${new Date(target.deliveredAt || "").toLocaleTimeString("pt-BR")}.`)
    }

    if (target.status === "CANCELLED") {
      throw new Error("Esta encomenda foi cancelada/devolvida e não pode ser entregue.")
    }

    const now = new Date().toISOString()
    target.status = "DELIVERED"
    target.deliveredAt = now
    target.version += 1

    this.events.unshift({
      id: generateUUID(),
      packageId: target.id,
      actorName: "Porteiro em Turno",
      eventType: "DELIVERED",
      metadata: {
        method: data.codeType,
        recipient: target.recipientNameRaw,
        unit: `${target.unit?.block}-${target.unit?.number}`,
      },
      createdAt: now,
    })

    return {
      success: true,
      packageItem: { ...target },
      message: `Entrega confirmada com sucesso para ${target.recipientNameRaw}!`,
    }
  }

  async extractLabel(_imageName?: string): Promise<ExtractLabelResponse> {
    // Simula tempo de resposta de IA Gemini 2.5 Flash (~1.2s)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const mockUnit = MOCK_UNITS[0] // Bloco B - 402 (Mariana Costa Silva)
    return {
      extracted: {
        recipientName: "Mariana Costa Silva",
        unitBlock: mockUnit.block,
        unitNumber: mockUnit.number,
        trackingCode: "BR26984120984ML",
        carrier: "Mercado Livre",
      },
      matchedUnitId: mockUnit.id,
      confidenceScore: 0.95,
      requiresReview: false,
      processingTimeMs: 1120,
    }
  }

  async listEvents(): Promise<PackageEvent[]> {
    return [...this.events].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  resetData(): void {
    this.packages = [...INITIAL_PACKAGES]
    this.events = [...INITIAL_EVENTS]
  }
}

export const mockPackageAdapter = new MockPackageAdapterImpl()

