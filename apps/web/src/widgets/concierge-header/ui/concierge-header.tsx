"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PackagePlus, KeyRound, LayoutGrid, Package } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

export function ConciergeHeader() {
  const pathname = usePathname()

  const tabs = [
    {
      label: "Visão Geral",
      href: "/portaria",
      icon: LayoutGrid,
      active: pathname === "/portaria",
    },
    {
      label: "Validar Retirada",
      href: "/portaria/checkout",
      icon: KeyRound,
      active: pathname === "/portaria/checkout",
    },
  ]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <Package className="size-5 text-[#E1FF01]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-tight">
                Terminal da Portaria
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-zinc-200 text-zinc-800">
                Ao Vivo
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Condomínio Solar das Palmeiras &bull; Gestão rápida de entregas
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

        {/* Primary Action Button - Vault Style */}
        <Link href="/portaria/checkin">
          <Button
            size="sm"
            className="rounded-lg bg-zinc-900 hover:bg-black text-white font-semibold text-xs h-9 px-4 gap-1.5 shadow-xs"
          >
            <PackagePlus className="size-3.5 text-[#E1FF01]" />
            <span>Novo Check-in +</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
