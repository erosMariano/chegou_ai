import {
  IAuthGateway,
  LoginCredentials,
  UserRole,
  UserSession,
} from "@/shared/ports/IAuthGateway"
import { httpPost } from "./http-client"

const STORAGE_KEY = "chegou_session"

/**
 * HttpAuthAdapter
 * Gerencia autenticação real contra o NestJS Core API (/api/v1/auth)
 * com persistência da sessão JWT e propagação reativa para a UI.
 */
export class HttpAuthAdapter implements IAuthGateway {
  private currentSession: UserSession | null = null
  private listeners: Set<(session: UserSession | null) => void> = new Set()

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          this.currentSession = JSON.parse(raw)
        }
      } catch {
        this.currentSession = null
      }
    }
  }

  async login(credentials: LoginCredentials): Promise<UserSession> {
    const res = await httpPost<{ user: UserSession; token: string }>("/auth/login", credentials)
    const session: UserSession = {
      ...res.user,
      token: res.token,
    }

    this.currentSession = session
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    }
    this.notify()
    return session
  }

  async loginAsDemo(role: UserRole): Promise<UserSession> {
    try {
      const res = await httpPost<{ user: UserSession; token: string }>(`/auth/demo/${role.toLowerCase()}`)
      const session: UserSession = {
        ...res.user,
        token: res.token,
      }
      this.currentSession = session
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      }
      this.notify()
      return session
    } catch {
      throw new Error(`Login de demonstração indisponível para o papel ${role} no backend.`)
    }
  }

  async logout(): Promise<void> {
    try {
      await httpPost("/auth/logout").catch(() => {})
    } finally {
      this.currentSession = null
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY)
      }
      this.notify()
    }
  }

  getCurrentSession(): UserSession | null {
    if (typeof window !== "undefined" && !this.currentSession) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          this.currentSession = JSON.parse(raw)
        }
      } catch {
        this.currentSession = null
      }
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

