"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { UserSession, UserRole, LoginCredentials } from "@/shared/ports/IAuthGateway"
import { authGateway } from "@/shared/ports"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: UserSession | null
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<UserSession>
  loginAsDemo: (role: UserRole) => Promise<UserSession>
  logout: () => Promise<void>
  resetDemoData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initial load from localStorage
    setUser(authGateway.getCurrentSession())
    setIsLoading(false)

    // Listen for session changes across tabs/windows
    const unsubscribe = authGateway.subscribe((updatedSession) => {
      setUser(updatedSession)
    })

    return () => {
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

  async function logout(): Promise<void> {
    await authGateway.logout()
    setUser(null)
    router.push("/login")
  }

  async function resetDemoData(): Promise<void> {
    await authGateway.resetDemoData()
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginAsDemo,
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

