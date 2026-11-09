"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldCheck, Building2, Users, MapPin, UserCheck, Settings, ArrowLeft } from "lucide-react"
import { cn } from "@/shared/lib/utils"

export function AdminHeader() {
  const pathname = usePathname()

  const tabs = [
    {
      label: "Auditoria & KPIs",
      href: "/admin",
      icon: ShieldCheck,
      active: pathname === "/admin",
    },
    {
      label: "Operadores",
      href: "/admin/usuarios",
      icon: UserCheck,
      active: pathname.startsWith("/admin/usuarios"),
    },
    {
      label: "Unidades & Moradores",
      href: "/admin/unidades",
      icon: Building2,
      active: pathname.startsWith("/admin/unidades") || pathname.startsWith("/admin/moradores"),
    },
    {
      label: "Configurações",
      href: "/admin/configuracoes",
      icon: Settings,
      active: pathname.startsWith("/admin/configuracoes") || pathname.startsWith("/admin/enderecos"),
    },
  ]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="size-5 text-[#E1FF01]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-tight">
                Painel do Síndico
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                Gestão &amp; LGPD
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Condomínio Solar das Palmeiras &bull; Base cadastral e conformidade
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200/80">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Link key={tab.href} href={tab.href}>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    tab.active
                      ? "bg-white text-zinc-950 shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-950"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                </button>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

