import { UserOperator, CreateUserFormData, UpdateUserFormData } from "@/entities/user/model/types"

export interface UserPort {
  listUsers(params?: {
    role?: string
    isActive?: boolean
    search?: string
    page?: number
    limit?: number
  }): Promise<{ items: UserOperator[]; total: number }>
  getUserById(id: string): Promise<UserOperator | null>
  createUser(data: CreateUserFormData): Promise<UserOperator>
  updateUser(id: string, data: UpdateUserFormData): Promise<UserOperator>
  toggleUserStatus(id: string): Promise<UserOperator>
  deleteUser(id: string): Promise<{ message: string; inactivated?: boolean; deleted?: boolean }>
}

