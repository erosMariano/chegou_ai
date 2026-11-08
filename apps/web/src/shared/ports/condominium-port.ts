import {
  CondominiumAddress,
  CreateCondominiumAddressInput,
  UpdateCondominiumAddressInput,
} from "@/entities/condominium/model/types"

export interface CondominiumPort {
  listAddresses(): Promise<CondominiumAddress[]>
  createAddress(data: CreateCondominiumAddressInput): Promise<CondominiumAddress>
  updateAddress(id: string, data: UpdateCondominiumAddressInput): Promise<CondominiumAddress>
  deleteAddress(id: string): Promise<void>
}

