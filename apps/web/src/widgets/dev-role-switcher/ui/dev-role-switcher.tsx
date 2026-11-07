"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldAlert, User, Shield, Check, Compass } from "lucide-react"
import { cn } from "@/shared/lib/utils"

export function DevRoleSwitcher() {
  const pathname = usePathname()

  const roles = [
    {
      name: "Porteiro",
      description: "Check-in com IA & Baixa",
      href: "/portaria",
      icon: Shield,
      active: pathname.startsWith("/portaria"),
    },
    {
      name: "Morador",
      description: "QR Code & PIN Pessoal",
      href: "/morador",
      icon: User,
      active: pathname.startsWith("/morador"),
    },
    {
      name: "Síndico / Admin",
      description: "Audit Log & Gestão",
      href: "/admin",
      icon: ShieldAlert,
      active: pathname.startsWith("/admin"),
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-indigo-600 flex items-center justify-center font-black text-white text-xs">
            C
          </div>
          <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
            CHEGOU<span className="text-indigo-400">.AI</span>
          </span>
          <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded ml-1">
            Dev Mock
          </span>
        </div>

        {/* Role Switcher Pills */}
        <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <Link
                key={role.name}
                href={role.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all",
                  role.active
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                )}
              >
                <Icon className="size-3.5" />
                <span>{role.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="text-[11px] text-slate-400 hidden md:flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>PostgreSQL &bull; Redis &bull; Gemini 2.5 Flash</span>
        </div>
      </div>
    </header>
  )
}

