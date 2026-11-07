import { PackagePort } from "@/shared/ports/package-port"
import {
  PackageItem,
  CheckinFormData,
  CheckoutFormData,
  ExtractLabelResponse,
  PackageEvent,
} from "@/entities/package/model/types"

/**
 * HttpPackageAdapter
 * Implementação pronta para integração futura com o NestJS Core API (/api/v1/packages)
 */
export class HttpPackageAdapter implements PackagePort {
  private baseUrl: string

  constructor(baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1") {
    this.baseUrl = baseUrl
  }

  async listPackages(filter?: { status?: string; unitId?: string }): Promise<PackageItem[]> {
    const params = new URLSearchParams()
    if (filter?.status) params.append("status", filter.status)
    if (filter?.unitId) params.append("unitId", filter.unitId)
    const res = await fetch(`${this.baseUrl}/packages?${params.toString()}`)
    if (!res.ok) throw new Error("Falha ao buscar encomendas na API")
    return res.json()
  }

  async getPackageById(id: string): Promise<PackageItem | null> {
    const res = await fetch(`${this.baseUrl}/packages/${id}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error("Falha ao buscar encomenda")
    return res.json()
  }

  async getPackageByQrToken(token: string): Promise<PackageItem | null> {
    const res = await fetch(`${this.baseUrl}/packages/qr/${token}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error("Token de QR inválido")
    return res.json()
  }

  async checkinPackage(data: CheckinFormData, idempotencyKey?: string): Promise<PackageItem> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey

    const res = await fetch(`${this.baseUrl}/packages`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Falha ao registrar check-in")
    return res.json()
  }

  async checkoutPackage(
    data: CheckoutFormData
  ): Promise<{ success: boolean; packageItem: PackageItem; message: string }> {
    const res = await fetch(`${this.baseUrl}/packages/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || "Erro ao realizar check-out")
    }
    return res.json()
  }

  async extractLabel(imageName?: string): Promise<ExtractLabelResponse> {
    const res = await fetch(`${this.baseUrl}/bff/packages/extract-label`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageName }),
    })
    if (!res.ok) throw new Error("Erro na extração multimodal de etiqueta")
    return res.json()
  }

  async listEvents(): Promise<PackageEvent[]> {
    const res = await fetch(`${this.baseUrl}/packages/events`)
    if (!res.ok) throw new Error("Erro ao listar eventos de auditoria")
    return res.json()
  }
}

