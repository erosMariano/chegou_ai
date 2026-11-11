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

export interface SetupStatus {
  initialized: boolean
}

export interface SetupInitialAdminInput {
  condominiumName: string
  cnpj?: string
  name: string
  email: string
  password: string
  address?: {
    label?: string
    zipCode: string
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
  }
}

export interface IAuthGateway {
  login(credentials: LoginCredentials): Promise<UserSession>
  loginAsDemo(role: UserRole): Promise<UserSession>
  getSetupStatus(): Promise<SetupStatus>
  setupInitialAdmin(input: SetupInitialAdminInput): Promise<UserSession>
  logout(): Promise<void>
  getCurrentSession(): UserSession | null
  subscribe(listener: (session: UserSession | null) => void): () => void
  resetDemoData(): Promise<void>
}

