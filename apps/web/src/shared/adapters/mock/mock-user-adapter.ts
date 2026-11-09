import { UserPort } from "@/shared/ports/user-port"
import { UserOperator, CreateUserFormData, UpdateUserFormData } from "@/entities/user/model/types"
import { generateUUID } from "@/shared/lib/utils"

const INITIAL_OPERATORS: UserOperator[] = [
  {
    id: "d1111111-1111-1111-1111-111111111111",
    name: "Carlos Alberto da Silva",
    email: "carlos.porteiro@condominio.com.br",
    role: "PORTER",
    isActive: true,
    createdAt: "2026-11-01T08:00:00Z",
    _count: { registeredPackages: 42 },
  },
  {
    id: "d2222222-2222-2222-2222-222222222222",
    name: "Antônio Ferreira (Turno Noite)",
    email: "antonio.noturno@condominio.com.br",
    role: "PORTER",
    isActive: true,
    createdAt: "2026-11-02T18:00:00Z",
    _count: { registeredPackages: 19 },
  },
  {
    id: "d3333333-3333-3333-3333-333333333333",
    name: "Roberto Mendes (Síndico)",
    email: "sindico@condominio.com.br",
    role: "ADMIN",
    isActive: true,
    createdAt: "2026-10-15T10:00:00Z",
    _count: { registeredPackages: 5 },
  },
]

export class MockUserAdapter implements UserPort {
  private operators: UserOperator[] = [...INITIAL_OPERATORS]

  async listUsers(params?: {
    role?: string
    isActive?: boolean
    search?: string
  }): Promise<{ items: UserOperator[]; total: number }> {
    let result = [...this.operators]

    if (params?.role && params.role !== "ALL") {
      result = result.filter((u) => u.role === params.role)
    }

    if (params?.isActive !== undefined) {
      result = result.filter((u) => u.isActive === params.isActive)
    }

    if (params?.search && params.search.trim()) {
      const term = params.search.toLowerCase().trim()
      result = result.filter(
        (u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
      )
    }

    return {
      items: result,
      total: result.length,
    }
  }

  async getUserById(id: string): Promise<UserOperator | null> {
    const found = this.operators.find((u) => u.id === id)
    return found ? { ...found } : null
  }

  async createUser(data: CreateUserFormData): Promise<UserOperator> {
    const existing = this.operators.find((u) => u.email.toLowerCase() === data.email.toLowerCase().trim())
    if (existing) {
      throw new Error("Já existe um operador cadastrado com este e-mail.")
    }

    const newUser: UserOperator = {
      id: generateUUID(),
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      role: data.role || "PORTER",
      isActive: true,
      createdAt: new Date().toISOString(),
      _count: { registeredPackages: 0 },
    }

    this.operators.unshift(newUser)
    return { ...newUser }
  }

  async updateUser(id: string, data: UpdateUserFormData): Promise<UserOperator> {
    const index = this.operators.findIndex((u) => u.id === id)
    if (index === -1) {
      throw new Error("Operador não encontrado.")
    }

    const current = this.operators[index]
    const updated: UserOperator = {
      ...current,
      name: data.name ? data.name.trim() : current.name,
      email: data.email ? data.email.toLowerCase().trim() : current.email,
      role: data.role || current.role,
      isActive: data.isActive !== undefined ? data.isActive : current.isActive,
    }

    this.operators[index] = updated
    return { ...updated }
  }

  async toggleUserStatus(id: string): Promise<UserOperator> {
    const index = this.operators.findIndex((u) => u.id === id)
    if (index === -1) {
      throw new Error("Operador não encontrado.")
    }

    this.operators[index] = {
      ...this.operators[index],
      isActive: !this.operators[index].isActive,
    }

    return { ...this.operators[index] }
  }

  async deleteUser(id: string): Promise<{ message: string; inactivated?: boolean; deleted?: boolean }> {
    const index = this.operators.findIndex((u) => u.id === id)
    if (index === -1) {
      throw new Error("Operador não encontrado.")
    }

    const target = this.operators[index]
    if (target._count?.registeredPackages && target._count.registeredPackages > 0) {
      this.operators[index].isActive = false
      return {
        message: "Operador possui pacotes registrados e foi inativado logicamente.",
        inactivated: true,
      }
    }

    this.operators.splice(index, 1)
    return {
      message: "Operador removido com sucesso.",
      deleted: true,
    }
  }
}

export const mockUserAdapter = new MockUserAdapter()

