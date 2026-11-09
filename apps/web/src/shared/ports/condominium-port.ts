import {
  CondominiumAddress,
  CreateCondominiumAddressInput,
  UpdateCondominiumAddressInput,
  CondominiumProfile,
  UpdateCondominiumProfileInput,
} from "@/entities/condominium/model/types"

export interface CondominiumPort {
  listAddresses(): Promise<CondominiumAddress[]>
  createAddress(data: CreateCondominiumAddressInput): Promise<CondominiumAddress>
  updateAddress(id: string, data: UpdateCondominiumAddressInput): Promise<CondominiumAddress>
  deleteAddress(id: string): Promise<void>
  getProfile(): Promise<CondominiumProfile>
  updateProfile(data: UpdateCondominiumProfileInput): Promise<CondominiumProfile>
}

