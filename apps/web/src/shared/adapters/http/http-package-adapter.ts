import { PackagePort } from "@/shared/ports/package-port"
import {
  PackageItem,
  CheckinFormData,
  CheckoutFormData,
  ExtractLabelResponse,
  PackageEvent,
} from "@/entities/package/model/types"
import { httpGet, httpPost } from "./http-client"

/**
 * HttpPackageAdapter
 * Implementação HTTP conectada à API NestJS Core (/api/v1/packages) conforme ADR-001 e api-contracts.md.
 */
export class HttpPackageAdapter implements PackagePort {
  async listPackages(filter?: { status?: string; unitId?: string }): Promise<PackageItem[]> {
    const params = new URLSearchParams()
    if (filter?.status && filter.status !== "ALL") params.append("status", filter.status)
    if (filter?.unitId && filter.unitId !== "ALL") params.append("unitId", filter.unitId)
    const query = params.toString() ? `?${params.toString()}` : ""
    const res = await httpGet<any>(`/packages${query}`, [])
    if (Array.isArray(res)) return res
    if (res && Array.isArray(res.items)) return res.items
    return []
  }

  async getPackageById(id: string): Promise<PackageItem | null> {
    return httpGet<PackageItem | null>(`/packages/${id}`, null)
  }

  async getPackageByQrToken(token: string): Promise<PackageItem | null> {
    return httpGet<PackageItem | null>(`/packages/qr/${token}`, null)
  }

  async checkinPackage(data: CheckinFormData, idempotencyKey?: string): Promise<PackageItem> {
    const customHeaders: Record<string, string> = {}
    if (idempotencyKey) {
      customHeaders["Idempotency-Key"] = idempotencyKey
    }
    return httpPost<PackageItem>("/packages", data, customHeaders)
  }

  async checkoutPackage(
    data: CheckoutFormData
  ): Promise<{ success: boolean; packageItem: PackageItem; message: string }> {
    return httpPost<{ success: boolean; packageItem: PackageItem; message: string }>(
      "/packages/checkout",
      data
    )
  }

  async extractLabel(imageName?: string): Promise<ExtractLabelResponse> {
    return httpPost<ExtractLabelResponse>("/bff/packages/extract-label", { imageName })
  }

  async listEvents(): Promise<PackageEvent[]> {
    return httpGet<PackageEvent[]>("/packages/events", [])
  }
}
