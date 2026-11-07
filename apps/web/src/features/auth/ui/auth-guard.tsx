"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/entities/user/ui/auth-provider"
import { UserRole } from "@/shared/ports/IAuthGateway"
import { Button } from "@/shared/ui/button"
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react"

interface AuthGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F3]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
          <p className="text-xs font-medium text-zinc-500">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isAuthorized = allowedRoles.includes(user.role)

  if (!isAuthorized) {
    const homeRoute =
      user.role === "PORTER"
        ? "/portaria"
        : user.role === "RESIDENT"
        ? "/morador"
        : "/admin"

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F3] px-4">
        <div className="w-full max-w-md p-8 rounded-lg bg-white border border-zinc-200/90 shadow-sm text-center space-y-5">
          <div className="size-14 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="size-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-zinc-900">Acesso Restrito</h2>
            <p className="text-xs text-zinc-500">
              Seu perfil atual (<span className="font-semibold text-zinc-800">{user.role}</span>) não possui permissão para acessar esta área.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push(homeRoute)}
              className="text-xs rounded-lg border-zinc-200"
            >
              <ArrowLeft className="size-3.5 mr-1.5" />
              Voltar ao Meu Painel
            </Button>
            <Button
              variant="ghost"
              onClick={() => logout()}
              className="text-xs rounded-lg text-zinc-600 hover:text-red-600"
            >
              <LogOut className="size-3.5 mr-1.5" />
              Trocar de Usuário
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

