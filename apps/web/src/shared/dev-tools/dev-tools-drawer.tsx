"use client"

import React, { useState } from "react"
import { isMockUiEnabled } from "./config"
import { useAuth } from "@/entities/user/ui/auth-provider"
import { UserRole } from "@/shared/ports/IAuthGateway"
import { Button } from "@/shared/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Wrench,
  X,
  RotateCcw,
  Shield,
  User,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from "lucide-react"

export function DevToolsDrawer() {
  const router = useRouter()
  const { user, loginAsDemo, resetDemoData } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  if (!isMockUiEnabled()) return null

  async function handleSwitchRole(role: UserRole) {
    try {
      const session = await loginAsDemo(role)
      toast.success(`Alternado para ${session.name}!`)
      setIsOpen(false)

      if (session.role === "PORTER") router.push("/portaria")
      else if (session.role === "RESIDENT") router.push("/morador")
      else if (session.role === "ADMIN") router.push("/admin")
    } catch {
      toast.error("Erro ao alternar papel")
    }
  }

  async function handleResetData() {
    try {
      setIsResetting(true)
      await resetDemoData()
      toast.success("Dados restaurados para o padrão de demonstração!", {
        description: "Encomendas, eventos e sessão foram resetados.",
      })
      setIsOpen(false)
    } catch {
      toast.error("Erro ao resetar dados")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-80 rounded-lg bg-white border border-zinc-200/90 shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom-3 fade-in duration-200 text-zinc-900">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
              <div className="size-6 rounded-lg bg-zinc-900 text-[#E1FF01] flex items-center justify-center">
                <Wrench className="size-3.5" />
              </div>
              <span>Mock DevTools</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Current Session Indicator */}
          <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/70 text-xs">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-0.5">
              Sessão Ativa
            </span>
            {user ? (
              <p className="font-semibold text-zinc-900">
                {user.name}{" "}
                <span className="text-zinc-500 font-normal">({user.role})</span>
              </p>
            ) : (
              <p className="text-zinc-500 italic">Desconectado (visitante)</p>
            )}
          </div>

          {/* Quick Role Switcher */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
              Alternar Papel (1 Toque)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleSwitchRole("PORTER")}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 text-[11px] font-medium transition-all"
              >
                <Shield className="size-3.5 text-zinc-800" />
                <span>Porteiro</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchRole("RESIDENT")}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-zinc-200 hover:border-emerald-600 hover:bg-emerald-50/40 text-[11px] font-medium transition-all"
              >
                <User className="size-3.5 text-emerald-700" />
                <span>Moradora</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchRole("ADMIN")}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-zinc-200 hover:border-amber-600 hover:bg-amber-50/40 text-[11px] font-medium transition-all"
              >
                <ShieldCheck className="size-3.5 text-amber-700" />
                <span>Síndico</span>
              </button>
            </div>
          </div>

          {/* Quick Links & Reset */}
          <div className="pt-2 border-t border-zinc-100 space-y-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isResetting}
              onClick={handleResetData}
              className="w-full h-8 rounded-lg text-xs font-semibold text-rose-700 border-rose-200 bg-rose-50/60 hover:bg-rose-100 hover:text-rose-800 transition-colors"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              {isResetting ? "Resetando..." : "Resetar Dados Demo"}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 text-white hover:bg-black shadow-lg hover:shadow-xl text-xs font-semibold border border-zinc-800 transition-all group cursor-pointer"
        >
          <span className="size-2 rounded-full bg-[#E1FF01] animate-pulse" />
          <span>Mock Tools</span>
          <ChevronDown className="size-3 text-zinc-400 group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}
    </div>
  )
}

