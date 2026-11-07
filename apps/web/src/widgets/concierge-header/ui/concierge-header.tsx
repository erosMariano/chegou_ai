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
      label: "Todas as Encomendas",
      href: "/portaria",
      icon: LayoutGrid,
      active: pathname === "/portaria",
    },
    {
      label: "Check-in com IA",
      href: "/portaria/checkin",
      icon: PackagePlus,
      active: pathname === "/portaria/checkin",
    },
    {
      label: "Dar Baixa (PIN/QR)",
      href: "/portaria/checkout",
      icon: KeyRound,
      active: pathname === "/portaria/checkout",
    },
  ]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Package className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Terminal da Portaria
            </h1>
            <p className="text-xs text-slate-500">
              Condomínio Solar das Palmeiras &bull; Operação em Tempo Real
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Link key={tab.href} href={tab.href}>
              <Button
                variant={tab.active ? "default" : "outline"}
                size="sm"
                className={cn(
                  "gap-1.5 text-xs font-semibold",
                  tab.active
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                )}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </Button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

