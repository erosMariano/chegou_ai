"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/entities/user/ui/auth-provider"
import { SetupCondominiumForm } from "@/features/setup-condominium/ui/setup-condominium-form"

export function SetupCondominiumGate() {
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
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-10 shadow-xs flex flex-col items-center justify-center gap-3">
        <div className="size-10 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
        <p className="text-xs font-medium text-zinc-500">
          Verificando estado do condomínio...
        </p>
      </div>
    )
  }

  return <SetupCondominiumForm />
}

