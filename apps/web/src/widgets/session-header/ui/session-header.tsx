"use client"

import React from "react"
import { useAuth } from "@/entities/user/ui/auth-provider"
import { Button } from "@/shared/ui/button"
import { LogOut, User, Shield, ShieldCheck } from "lucide-react"
import { cn } from "@/shared/lib/utils"

export function SessionHeader() {
  const { user, logout } = useAuth()

  if (!user) return null

  const roleConfig = {
    PORTER: {
      label: "Portaria",
      badgeClass: "bg-zinc-100 text-zinc-800 border-zinc-200",
      icon: Shield,
    },
    RESIDENT: {
      label: user.unit ? `Bloco ${user.unit.block} • Apto ${user.unit.number}` : "Morador",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: User,
    },
    ADMIN: {
      label: "Síndico / Admin",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      icon: ShieldCheck,
    },
  }[user.role]

  const RoleIcon = roleConfig.icon

  return (
    <header className="w-full bg-white border-b border-zinc-200/80 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-black text-xs shadow-xs">
            C
          </div>
          <span className="font-extrabold text-sm tracking-tight text-zinc-950">
            CHEGOU<span className="text-zinc-400">.AI</span>
          </span>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-50 border border-zinc-200/80">
            <div className="size-6 rounded-lg bg-zinc-200 text-zinc-700 flex items-center justify-center text-[11px] font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-zinc-900 hidden sm:inline">{user.name}</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border",
                  roleConfig.badgeClass
                )}
              >
                <RoleIcon className="size-2.5" />
                <span>{roleConfig.label}</span>
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className="h-8 px-2.5 text-xs text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sair do sistema"
          >
            <LogOut className="size-3.5 mr-1" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

