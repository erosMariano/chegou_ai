import { UnitPort } from "@/shared/ports/unit-port"
import { Unit } from "@/entities/unit/model/types"
import { Resident } from "@/entities/resident/model/types"
import { MOCK_UNITS, MOCK_RESIDENTS } from "./mock-data"

class MockUnitAdapterImpl implements UnitPort {
  async listUnits(): Promise<Unit[]> {
    return [...MOCK_UNITS]
  }

  async getUnitById(id: string): Promise<Unit | null> {
    const unit = MOCK_UNITS.find((u) => u.id === id)
    return unit ? { ...unit } : null
  }

  async listResidentsByUnit(unitId: string): Promise<Resident[]> {
    return MOCK_RESIDENTS.filter((r) => r.unitId === unitId)
  }

  async listAllResidents(): Promise<Resident[]> {
    return [...MOCK_RESIDENTS]
  }
}

export const mockUnitAdapter = new MockUnitAdapterImpl()

