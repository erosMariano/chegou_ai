import { Unit } from "@/entities/unit/model/types"
import { Resident } from "@/entities/resident/model/types"

export interface UnitPort {
  listUnits(): Promise<Unit[]>
  getUnitById(id: string): Promise<Unit | null>
  listResidentsByUnit(unitId: string): Promise<Resident[]>
  listAllResidents(): Promise<Resident[]>
}

