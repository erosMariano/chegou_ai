import {
  UnitPort,
  CreateUnitInput,
  UpdateUnitInput,
  CreateResidentInput,
  UpdateResidentInput,
} from "@/shared/ports/unit-port"
import { Unit } from "@/entities/unit/model/types"
import { Resident } from "@/entities/resident/model/types"
import { MOCK_UNITS, MOCK_RESIDENTS } from "./mock-data"
import { generateUUID } from "@/shared/lib/utils"

class MockUnitAdapterImpl implements UnitPort {
  private units: Unit[] = [...MOCK_UNITS]
  private residents: Resident[] = [...MOCK_RESIDENTS]

  // Unidades
  async listUnits(): Promise<Unit[]> {
    return [...this.units]
  }

  async getUnitById(id: string): Promise<Unit | null> {
    const unit = this.units.find((u) => u.id === id)
    return unit ? { ...unit } : null
  }

  async createUnit(data: CreateUnitInput): Promise<Unit> {
    const newUnit: Unit = {
      id: generateUUID(),
      block: (data.block || "UNICO").trim().toUpperCase(),
      number: data.number.trim(),
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
    }
    this.units.push(newUnit)
    return { ...newUnit }
  }

  async updateUnit(id: string, data: UpdateUnitInput): Promise<Unit> {
    const index = this.units.findIndex((u) => u.id === id)
    if (index === -1) throw new Error("Unidade não encontrada")

    const updated = {
      ...this.units[index],
      ...data,
      block: data.block ? data.block.trim().toUpperCase() : this.units[index].block,
      number: data.number ? data.number.trim() : this.units[index].number,
    }
    this.units[index] = updated
    return { ...updated }
  }

  async deleteUnit(id: string): Promise<void> {
    this.units = this.units.filter((u) => u.id !== id)
    // Desvincula moradores
    this.residents = this.residents.filter((r) => r.unitId !== id)
  }

  // Moradores
  async listResidentsByUnit(unitId: string): Promise<Resident[]> {
    return this.residents.filter((r) => r.unitId === unitId)
  }

  async listAllResidents(): Promise<Resident[]> {
    return [...this.residents]
  }

  async getResidentById(id: string): Promise<Resident | null> {
    const res = this.residents.find((r) => r.id === id)
    return res ? { ...res } : null
  }

  async createResident(data: CreateResidentInput): Promise<Resident> {
    const newResident: Resident = {
      id: generateUUID(),
      unitId: data.unitId,
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || undefined,
      documentLast4: data.documentLast4.trim(),
      isPrimary: data.isPrimary ?? false,
      createdAt: new Date().toISOString(),
    }
    this.residents.push(newResident)
    return { ...newResident }
  }

  async updateResident(id: string, data: UpdateResidentInput): Promise<Resident> {
    const index = this.residents.findIndex((r) => r.id === id)
    if (index === -1) throw new Error("Morador não encontrado")

    const updated = {
      ...this.residents[index],
      ...data,
      fullName: data.fullName ? data.fullName.trim() : this.residents[index].fullName,
      email: data.email ? data.email.trim().toLowerCase() : this.residents[index].email,
      phone: data.phone !== undefined ? (data.phone?.trim() || undefined) : this.residents[index].phone,
    }
    this.residents[index] = updated
    return { ...updated }
  }

  async deleteResident(id: string): Promise<void> {
    this.residents = this.residents.filter((r) => r.id !== id)
  }

  async generateResidentInvite(residentId: string): Promise<{ token: string; inviteUrl: string }> {
    const resident = this.residents.find((r) => r.id === residentId)
    const token = generateUUID()
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
    return {
      token,
      inviteUrl: `${origin}/ativar-conta?token=${token}&email=${encodeURIComponent(resident?.email || "")}`,
    }
  }

  async importUnitsBatch(items: Array<{ block?: string; number: string }>): Promise<{ totalReceived: number; created: number; skipped: number }> {
    let created = 0
    let skipped = 0
    for (const item of items) {
      const block = (item.block || "UNICO").toUpperCase().trim()
      const number = item.number.trim()
      const exists = this.units.some((u) => u.block === block && u.number === number)
      if (exists) {
        skipped++
      } else {
        this.units.push({
          id: generateUUID(),
          block,
          number,
          isActive: true,
          createdAt: new Date().toISOString(),
        })
        created++
      }
    }
    return { totalReceived: items.length, created, skipped }
  }

  async importResidentsBatch(items: Array<{ block?: string; number: string; fullName: string; email: string; phone?: string; isPrimary?: boolean }>): Promise<{ totalReceived: number; created: number; errors: string[] }> {
    let created = 0
    const errors: string[] = []
    for (const item of items) {
      const block = (item.block || "UNICO").toUpperCase().trim()
      const number = item.number.trim()
      let unit = this.units.find((u) => u.block === block && u.number === number)
      if (!unit) {
        unit = {
          id: generateUUID(),
          block,
          number,
          isActive: true,
          createdAt: new Date().toISOString(),
        }
        this.units.push(unit)
      }
      this.residents.push({
        id: generateUUID(),
        unitId: unit.id,
        fullName: item.fullName.trim(),
        email: item.email.toLowerCase().trim(),
        phone: item.phone?.trim(),
        documentLast4: "0000",
        isPrimary: item.isPrimary || false,
        createdAt: new Date().toISOString(),
      })
      created++
    }
    return { totalReceived: items.length, created, errors }
  }

  resetData(): void {
    this.units = [...MOCK_UNITS]
    this.residents = [...MOCK_RESIDENTS]
  }
}

export const mockUnitAdapter = new MockUnitAdapterImpl()
