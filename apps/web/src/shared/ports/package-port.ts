import {
  PackageItem,
  CheckinFormData,
  CheckoutFormData,
  ExtractLabelResponse,
  PackageEvent,
} from "@/entities/package/model/types"

export interface PackagePort {
  listPackages(filter?: { status?: string; unitId?: string }): Promise<PackageItem[]>
  getPackageById(id: string): Promise<PackageItem | null>
  getPackageByQrToken(token: string): Promise<PackageItem | null>
  checkinPackage(data: CheckinFormData, idempotencyKey?: string): Promise<PackageItem>
  checkoutPackage(
    data: CheckoutFormData
  ): Promise<{ success: boolean; packageItem: PackageItem; message: string }>
  extractLabel(imageName?: string): Promise<ExtractLabelResponse>
  listEvents(): Promise<PackageEvent[]>
}

