import {
  CondominiumAddress,
  CreateCondominiumAddressInput,
  UpdateCondominiumAddressInput,
} from "@/entities/condominium/model/types"
import { CondominiumPort } from "@/shared/ports/condominium-port"
import { httpGet, httpPost, httpPatch, httpDelete } from "./http-client"

export class HttpCondominiumAdapter implements CondominiumPort {
  async listAddresses(): Promise<CondominiumAddress[]> {
    return httpGet<CondominiumAddress[]>("/condominium/addresses", [])
  }

  async createAddress(data: CreateCondominiumAddressInput): Promise<CondominiumAddress> {
    return httpPost<CondominiumAddress>("/condominium/addresses", data)
  }

  async updateAddress(id: string, data: UpdateCondominiumAddressInput): Promise<CondominiumAddress> {
    return httpPatch<CondominiumAddress>(`/condominium/addresses/${id}`, data)
  }

  async deleteAddress(id: string): Promise<void> {
    return httpDelete(`/condominium/addresses/${id}`)
  }
}

