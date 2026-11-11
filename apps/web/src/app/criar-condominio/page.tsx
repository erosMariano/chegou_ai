"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/entities/user/ui/auth-provider"
import { SetupCondominiumForm } from "@/features/setup-condominium/ui/setup-condominium-form"
import { Sparkles, ArrowLeft } from "lucide-react"

export default function CriarCondominioPage() {
  const router = useRouter()
  const { user, isLoading, getSetupStatus } = useAuth()
  const [canInitialize, setCanInitialize] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "PORTER") router.replace("/portaria")
      else if (user.role === "RESIDENT") router.replace("/morador")
      else if (user.role === "ADMIN") router.replace("/admin")
      return
    }

    let isMounted = true
    getSetupStatus()
      .then((status) => {
        if (!isMounted) return
        if (status.initialized) {
          // Condomínio já configurado: bloqueia acesso público ao onboarding
          router.replace("/login")
        } else {
          setCanInitialize(true)
        }
      })
      .catch(() => {
        if (isMounted) router.replace("/login")
      })

    return () => {
      isMounted = false
    }
  }, [user, isLoading, getSetupStatus, router])

  if (isLoading || canInitialize !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F3]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
          <p className="text-xs font-medium text-zinc-500">
            Verificando estado do condomínio...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-[#F4F4F3] text-zinc-900">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold shadow-xs">
            <span className="size-2 rounded-full bg-[#E1FF01] animate-pulse" />
            <span>
              CHEGOU<span className="text-zinc-400">.AI</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-normal ml-1">
              Configuração Inicial
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            Criar Meu Condomínio
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto">
            Configure o perfil do seu condomínio, endereço oficial para a IA e a conta principal do síndico para iniciar a operação.
          </p>
        </div>

        <SetupCondominiumForm />

        <div className="flex flex-col items-center gap-2 pt-1">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Voltar para a tela de Login
          </Link>

          <p className="text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5">
            <Sparkles className="size-3 text-zinc-400" />
            Conformidade com LGPD &bull; Setup atômico seguro
          </p>
        </div>
      </div>
    </div>
  )
}

