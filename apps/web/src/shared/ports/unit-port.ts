import { Unit } from "@/entities/unit/model/types"
import { Resident } from "@/entities/resident/model/types"

export type CreateUnitInput = {
  block?: string
  number: string
  isActive?: boolean
  condominiumId?: string
}
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
  generateResidentInvite(residentId: string): Promise<{ token: string; inviteUrl: string }>

  // Importação em Lote
  importUnitsBatch(items: Array<{ block?: string; number: string }>): Promise<{ totalReceived: number; created: number; skipped: number }>
  importResidentsBatch(items: Array<{ block?: string; number: string; fullName: string; email: string; phone?: string; isPrimary?: boolean }>): Promise<{ totalReceived: number; created: number; errors: string[] }>
}
