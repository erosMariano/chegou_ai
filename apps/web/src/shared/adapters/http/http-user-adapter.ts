import { UserPort } from "@/shared/ports/user-port"
import { UserOperator, CreateUserFormData, UpdateUserFormData } from "@/entities/user/model/types"
import { httpGet, httpPost, httpPut, httpPatch, httpDelete } from "./http-client"

export class HttpUserAdapter implements UserPort {
  async listUsers(params?: {
    role?: string
    isActive?: boolean
    search?: string
    page?: number
    limit?: number
  }): Promise<{ items: UserOperator[]; total: number }> {
    const query = new URLSearchParams()
    if (params?.role && params.role !== "ALL") query.append("role", params.role)
    if (params?.isActive !== undefined) query.append("isActive", String(params.isActive))
    if (params?.search) query.append("search", params.search)
    if (params?.page) query.append("page", String(params.page))
    if (params?.limit) query.append("limit", String(params.limit))

    const queryString = query.toString() ? `?${query.toString()}` : ""
    const res = await httpGet<any>(`/users${queryString}`, { items: [], total: 0 })
    if (Array.isArray(res)) {
      return { items: res, total: res.length }
    }
    return {
      items: res?.items || [],
      total: res?.total || 0,
    }
  }

  async getUserById(id: string): Promise<UserOperator | null> {
    return httpGet<UserOperator | null>(`/users/${id}`, null)
  }

  async createUser(data: CreateUserFormData): Promise<UserOperator> {
    return httpPost<UserOperator>("/users", data)
  }

  async updateUser(id: string, data: UpdateUserFormData): Promise<UserOperator> {
    return httpPut<UserOperator>(`/users/${id}`, data)
  }

  async toggleUserStatus(id: string): Promise<UserOperator> {
    return httpPatch<UserOperator>(`/users/${id}/toggle-status`, {})
  }

  async deleteUser(id: string): Promise<{ message: string; inactivated?: boolean; deleted?: boolean }> {
    return httpDelete<{ message: string; inactivated?: boolean; deleted?: boolean }>(`/users/${id}`)
  }
}

