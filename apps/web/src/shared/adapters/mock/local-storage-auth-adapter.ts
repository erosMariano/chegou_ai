import {
  IAuthGateway,
  UserSession,
  UserRole,
  LoginCredentials,
} from "@/shared/ports/IAuthGateway"
import { DEMO_USERS } from "./mock-data"
import { mockPackageAdapter } from "./mock-package-adapter"

const SESSION_STORAGE_KEY = "chegou_ai_session"
const AUTH_CHANGE_EVENT = "chegou_ai_auth_change"

export class LocalStorageAuthAdapter implements IAuthGateway {
  private isClient(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined"
  }

  getCurrentSession(): UserSession | null {
    if (!this.isClient()) return null
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!stored) return null
      return JSON.parse(stored) as UserSession
    } catch {
      return null
    }
  }

  async login(credentials: LoginCredentials): Promise<UserSession> {
    const cleanEmail = credentials.email.trim().toLowerCase()
    const cleanPass = credentials.password?.trim()

    const foundEntry = Object.values(DEMO_USERS).find(
      (entry) =>
        entry.session.email.toLowerCase() === cleanEmail &&
        (!cleanPass || entry.password === cleanPass)
    )

    if (!foundEntry) {
      throw new Error(
        "Credenciais inválidas. Use um dos e-mails cadastrados (senha: 123456) ou o Acesso Rápido Demo."
      )
    }

    this.saveSession(foundEntry.session)
    return foundEntry.session
  }

  async loginAsDemo(role: UserRole): Promise<UserSession> {
    let key: "porteiro" | "morador" | "sindico" = "porteiro"
    if (role === "RESIDENT") key = "morador"
    if (role === "ADMIN") key = "sindico"

    const demo = DEMO_USERS[key]
    this.saveSession(demo.session)
    return demo.session
  }

  async logout(): Promise<void> {
    if (this.isClient()) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      this.notifyListeners()
    }
  }

  subscribe(listener: (session: UserSession | null) => void): () => void {
    if (!this.isClient()) return () => {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === SESSION_STORAGE_KEY) {
        listener(this.getCurrentSession())
      }
    }

    const handleCustomEvent = () => {
      listener(this.getCurrentSession())
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(AUTH_CHANGE_EVENT, handleCustomEvent)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(AUTH_CHANGE_EVENT, handleCustomEvent)
    }
  }

  async resetDemoData(): Promise<void> {
    // Restaura encomendas e eventos na memória
    mockPackageAdapter.resetData()

    if (this.isClient()) {
      // Remove a sessão atual
      localStorage.removeItem(SESSION_STORAGE_KEY)
      this.notifyListeners()
    }
  }

  private saveSession(session: UserSession): void {
    if (!this.isClient()) return
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    this.notifyListeners()
  }

  private notifyListeners(): void {
    if (!this.isClient()) return
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT))
  }
}

export const localStorageAuthAdapter = new LocalStorageAuthAdapter()

