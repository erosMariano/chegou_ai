import { Unit } from "@/entities/unit/model/types"
import { Resident } from "@/entities/resident/model/types"

export type CreateUnitInput = Omit<Unit, "id" | "createdAt">
export type UpdateUnitInput = Partial<CreateUnitInput>

export type CreateResidentInput = Omit<Resident, "id" | "createdAt">
export type UpdateResidentInput = Partial<CreateResidentInput>

export interface UnitPort {
  // Unidades
  listUnits(): Promise<Unit[]>
  getUnitById(id: string): Promise<Unit | null>
  createUnit(data: CreateUnitInput): Promise<Unit>
  updateUnit(id: string, data: UpdateUnitInput): Promise<Unit>
  deleteUnit(id: string): Promise<void>

  // Moradores
  listResidentsByUnit(unitId: string): Promise<Resident[]>
  listAllResidents(): Promise<Resident[]>
  getResidentById(id: string): Promise<Resident | null>
  createResident(data: CreateResidentInput): Promise<Resident>
  updateResident(id: string, data: UpdateResidentInput): Promise<Resident>
  deleteResident(id: string): Promise<void>
}
