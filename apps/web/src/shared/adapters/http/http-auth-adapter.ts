import {
  ActivateAccountInput,
  IAuthGateway,
  LoginCredentials,
  SetupInitialAdminInput,
  SetupStatus,
  UserRole,
  UserSession,
} from "@/shared/ports/IAuthGateway"
import { httpGet, httpPost } from "./http-client"

const STORAGE_KEY = "chegou_session"
const VALID_ROLES = new Set<UserRole>(["PORTER", "RESIDENT", "ADMIN"])

interface RawAuthPayload {
  user?: Record<string, unknown>
  token?: string
  [key: string]: unknown
}

function normalizeUserRole(value: unknown): UserRole | null {
  if (typeof value !== "string") return null
  const upper = value.toUpperCase() as UserRole
  return VALID_ROLES.has(upper) ? upper : null
}

function normalizeSession(payload: unknown): UserSession | null {
  if (!payload || typeof payload !== "object") return null

  const raw = payload as RawAuthPayload
  const source = raw.user && typeof raw.user === "object" ? raw.user : raw
  const role = normalizeUserRole(source.role)
  const token = typeof raw.token === "string" ? raw.token : typeof source.token === "string" ? source.token : ""

  if (!role || !token) return null

  const id = typeof source.id === "string" ? source.id : ""
  const email = typeof source.email === "string" ? source.email : ""
  const name = typeof source.name === "string" && source.name.trim() ? source.name : email || "Usuário"

  const unitRaw = source.unit
  const unit =
    unitRaw && typeof unitRaw === "object"
      ? {
          unitId: String((unitRaw as Record<string, unknown>).unitId ?? ""),
          block: String((unitRaw as Record<string, unknown>).block ?? ""),
          number: String((unitRaw as Record<string, unknown>).number ?? ""),
        }
      : undefined

  return {
    id,
    name,
    email,
    role,
    residentId: typeof source.residentId === "string" ? source.residentId : undefined,
    unit,
    token,
  }
}

/**
 * HttpAuthAdapter
 * Gerencia autenticação real contra o NestJS Core API (/api/v1/auth)
 * com persistência da sessão JWT e propagação reativa para a UI.
 */
export class HttpAuthAdapter implements IAuthGateway {
  private currentSession: UserSession | null = null
  private listeners: Set<(session: UserSession | null) => void> = new Set()

  constructor() {
    this.loadStoredSession()
  }

  private loadStoredSession(): UserSession | null {
    if (typeof window === "undefined") return null

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null

      const parsed: unknown = JSON.parse(raw)
      const normalized = normalizeSession(parsed)

      if (!normalized) {
        localStorage.removeItem(STORAGE_KEY)
        this.currentSession = null
        return null
      }

      // Auto-cura formato legado/aninhado { user, token } salvo diretamente no storage
      if (parsed && typeof parsed === "object" && "user" in parsed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      }

      this.currentSession = normalized
      return normalized
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      this.currentSession = null
      return null
    }
  }

  private saveAndNotify(payload: unknown): UserSession {
    const session = normalizeSession(payload)
    if (!session) {
      throw new Error("Resposta de sessão inválida retornada pela API.")
    }

    this.currentSession = session
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    }
    this.notify()
    return session
  }

  async login(credentials: LoginCredentials): Promise<UserSession> {
    const res = await httpPost<{ user: UserSession; token: string }>("/auth/login", credentials)
    return this.saveAndNotify(res)
  }

  async loginAsDemo(role: UserRole): Promise<UserSession> {
    try {
      const res = await httpPost<{ user: UserSession; token: string }>(`/auth/demo/${role.toLowerCase()}`)
      return this.saveAndNotify(res)
    } catch {
      throw new Error(`Login de demonstração indisponível para o papel ${role} no backend.`)
    }
  }

  async getSetupStatus(): Promise<SetupStatus> {
    return httpGet<SetupStatus>("/auth/setup-status", { initialized: true })
  }

  async setupInitialAdmin(input: SetupInitialAdminInput): Promise<UserSession> {
    const res = await httpPost<{ user: UserSession; token: string }>(
      "/auth/setup-initial-admin",
      input
    )
    return this.saveAndNotify(res)
  }

  async activateAccount(input: ActivateAccountInput): Promise<UserSession> {
    const res = await httpPost<{ user: UserSession; token: string }>("/auth/activate", {
      email: input.email.trim().toLowerCase(),
      token: input.token.trim(),
      password: input.password,
    })
    return this.saveAndNotify(res)
  }

  async logout(): Promise<void> {
    try {
      await httpPost("/auth/logout").catch(() => {})
    } finally {
      this.currentSession = null
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem("chegou_ai_auth_session")
      }
      this.notify()
    }
  }

  getCurrentSession(): UserSession | null {
    if (typeof window !== "undefined" && !this.currentSession) {
      return this.loadStoredSession()
    }
    return this.currentSession
  }

  subscribe(listener: (session: UserSession | null) => void): () => void {
    this.listeners.add(listener)
    listener(this.getCurrentSession())
    return () => {
      this.listeners.delete(listener)
    }
  }

  async resetDemoData(): Promise<void> {
    // Em modo HTTP real, os dados são gerenciados pelas migrations e seeders do PostgreSQL/Prisma
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentSession)
      } catch (err) {
        console.error("[HttpAuthAdapter] Erro no listener de autenticação:", err)
      }
    })
  }
}
