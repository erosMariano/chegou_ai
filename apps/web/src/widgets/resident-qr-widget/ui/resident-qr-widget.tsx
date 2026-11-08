"use client"

import React from "react"
import { ShineBorder } from "@/shared/ui/shine-border"
import { PackageItem } from "@/entities/package/model/types"
import { StatusBadge } from "@/shared/ui/status-badge"
import { Truck, ShieldCheck, KeyRound, Clock } from "lucide-react"

interface ResidentQrWidgetProps {
  packageItem: PackageItem
}

export function ResidentQrWidget({ packageItem }: ResidentQrWidgetProps) {
  // Format PIN in spaced groups: e.g. 482 • 910
  const pin = packageItem.pickupPin || ""
  const formattedPin =
    pin && pin.length === 6
      ? `${pin.slice(0, 3)} • ${pin.slice(3)}`
      : pin || "------"

  const receivedTime = new Date(packageItem.receivedAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="relative overflow-hidden rounded-lg bg-white border border-zinc-200/90 shadow-md max-w-sm mx-auto text-center">
      {/* Magic UI Subtle Shine Border */}
      <ShineBorder
        borderWidth={2}
        duration={8}
        shineColor={["#18181B", "#E1FF01", "#10B981"]}
      />

      {/* Apple Wallet Style Pass Content */}
      <div className="relative z-10 p-6 space-y-6">
        {/* Pass Top Branding */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">
              Passe de Retirada
            </span>
            <h3 className="text-base font-extrabold text-zinc-950">
              {packageItem.recipientNameRaw}
            </h3>
          </div>
          <StatusBadge status={packageItem.status} />
        </div>

        {/* Carrier & Unit Info */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5 text-zinc-600 font-medium">
            <Truck className="size-3.5 text-zinc-400" />
            <span>{packageItem.carrier || "Encomenda"}</span>
          </div>

          <span className="font-bold text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-lg border border-zinc-200/60 text-[11px]">
            Bl. {packageItem.unit?.block} &bull; Apto {packageItem.unit?.number}
          </span>
        </div>

        {/* Large Centered PIN Hero Box */}
        <div className="py-6 px-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-md space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-300 border border-zinc-700/60 mx-auto">
            <KeyRound className="size-3 text-[#E1FF01]" />
            <span>Código PIN da Portaria</span>
          </div>

          <div className="py-2">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-[#E1FF01] drop-shadow-xs">
              {formattedPin}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400">
            Informe este código ao porteiro para retirar seu pacote
          </p>
        </div>

        {/* Details row */}
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span className="font-mono text-[11px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-lg font-medium">
            {packageItem.trackingCode || "Entrega Local"}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <Clock className="size-3" />
            <span>Recebido às {receivedTime}</span>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="pt-1 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
          <span>Retirada 100% segura com auditoria em tempo real.</span>
        </div>
      </div>
    </div>
  )
}
