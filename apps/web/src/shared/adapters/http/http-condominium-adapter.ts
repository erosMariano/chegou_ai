import {
  CondominiumAddress,
  CreateCondominiumAddressInput,
  UpdateCondominiumAddressInput,
  CondominiumProfile,
  UpdateCondominiumProfileInput,
} from "@/entities/condominium/model/types"
import { CondominiumPort } from "@/shared/ports/condominium-port"
import { httpGet, httpPost, httpPatch, httpPut, httpDelete } from "./http-client"

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

  async getProfile(): Promise<CondominiumProfile> {
    return httpGet<CondominiumProfile>("/condominium/profile", {
      id: "default",
      name: "Condomínio Residencial",
    })
  }

  async updateProfile(data: UpdateCondominiumProfileInput): Promise<CondominiumProfile> {
    return httpPut<CondominiumProfile>("/condominium/profile", data)
  }
}

