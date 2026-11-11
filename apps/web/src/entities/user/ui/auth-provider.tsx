"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  UserSession,
  UserRole,
  LoginCredentials,
  SetupInitialAdminInput,
  SetupStatus,
} from "@/shared/ports/IAuthGateway"
import { authGateway } from "@/shared/ports"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: UserSession | null
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<UserSession>
  loginAsDemo: (role: UserRole) => Promise<UserSession>
  getSetupStatus: () => Promise<SetupStatus>
  setupInitialAdmin: (input: SetupInitialAdminInput) => Promise<UserSession>
  logout: () => Promise<void>
  resetDemoData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    // Defer initial localStorage hydration to keep effect state updates asynchronous
    queueMicrotask(() => {
      if (isCancelled) return
      try {
        setUser(authGateway.getCurrentSession())
      } catch (err) {
        console.error("[AuthProvider] Falha ao recuperar sessão local:", err)
      } finally {
        setIsLoading(false)
      }
    })

    // Listen for session changes across tabs/windows
    const unsubscribe = authGateway.subscribe((updatedSession) => {
      setUser(updatedSession)
    })

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [])

  async function login(credentials: LoginCredentials): Promise<UserSession> {
    const session = await authGateway.login(credentials)
    setUser(session)
    return session
  }

  async function loginAsDemo(role: UserRole): Promise<UserSession> {
    const session = await authGateway.loginAsDemo(role)
    setUser(session)
    return session
  }

  async function getSetupStatus(): Promise<SetupStatus> {
    return authGateway.getSetupStatus()
  }

  async function setupInitialAdmin(input: SetupInitialAdminInput): Promise<UserSession> {
    const session = await authGateway.setupInitialAdmin(input)
    setUser(session)
    return session
  }

  async function logout(): Promise<void> {
    try {
      await authGateway.logout()
    } finally {
      setUser(null)
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      } else {
        router.push("/login")
      }
    }
  }

  async function resetDemoData(): Promise<void> {
    try {
      await authGateway.resetDemoData()
    } finally {
      setUser(null)
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      } else {
        router.push("/login")
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginAsDemo,
        getSetupStatus,
        setupInitialAdmin,
        logout,
        resetDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

