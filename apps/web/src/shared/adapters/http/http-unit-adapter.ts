import {
  UnitPort,
  CreateUnitInput,
  UpdateUnitInput,
  CreateResidentInput,
  UpdateResidentInput,
} from "@/shared/ports/unit-port"
import { Unit } from "@/entities/unit/model/types"
import { Resident } from "@/entities/resident/model/types"
import { httpGet, httpPost, httpPut, httpDelete } from "./http-client"

/**
 * HttpUnitAdapter
 * Implementação HTTP conectada à API NestJS Core (/api/v1/units e /api/v1/residents)
 * seguindo os contratos do database-schema.md e api-contracts.md.
 */
export class HttpUnitAdapter implements UnitPort {
  // --- Unidades ---
  async listUnits(): Promise<Unit[]> {
    return httpGet<Unit[]>("/units", [])
  }

  async getUnitById(id: string): Promise<Unit | null> {
    return httpGet<Unit | null>(`/units/${id}`, null)
  }

  async createUnit(data: CreateUnitInput): Promise<Unit> {
    return httpPost<Unit>("/units", data)
  }

  async updateUnit(id: string, data: UpdateUnitInput): Promise<Unit> {
    return httpPut<Unit>(`/units/${id}`, data)
  }

  async deleteUnit(id: string): Promise<void> {
    return httpDelete(`/units/${id}`)
  }

  // --- Moradores ---
  async listResidentsByUnit(unitId: string): Promise<Resident[]> {
    return httpGet<Resident[]>(`/residents?unitId=${unitId}`, [])
  }

  async listAllResidents(): Promise<Resident[]> {
    return httpGet<Resident[]>("/residents", [])
  }

  async getResidentById(id: string): Promise<Resident | null> {
    return httpGet<Resident | null>(`/residents/${id}`, null)
  }

  async createResident(data: CreateResidentInput): Promise<Resident> {
    return httpPost<Resident>("/residents", data)
  }

  async updateResident(id: string, data: UpdateResidentInput): Promise<Resident> {
    return httpPut<Resident>(`/residents/${id}`, data)
  }

  async deleteResident(id: string): Promise<void> {
    return httpDelete(`/residents/${id}`)
  }
}

