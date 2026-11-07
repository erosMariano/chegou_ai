export type UserRole = "PORTER" | "RESIDENT" | "ADMIN"

export interface UserSession {
  id: string
  name: string
  email: string
  role: UserRole
  residentId?: string
  unit?: {
    unitId: string
    block: string
    number: string
  }
  token: string
}

export interface LoginCredentials {
  email: string
  password?: string
}

export interface IAuthGateway {
  login(credentials: LoginCredentials): Promise<UserSession>
  loginAsDemo(role: UserRole): Promise<UserSession>
  logout(): Promise<void>
  getCurrentSession(): UserSession | null
  subscribe(listener: (session: UserSession | null) => void): () => void
  resetDemoData(): Promise<void>
}

