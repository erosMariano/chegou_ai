"use client"

import React from "react"
import { QRCodeSVG } from "qrcode.react"
import { ShineBorder } from "@/shared/ui/shine-border"
import { PackageItem } from "@/entities/package/model/types"
import { StatusBadge } from "@/shared/ui/status-badge"
import { Truck, ShieldCheck, QrCode } from "lucide-react"

interface ResidentQrWidgetProps {
  packageItem: PackageItem
}

export function ResidentQrWidget({ packageItem }: ResidentQrWidgetProps) {
  // Format PIN in spaced groups: e.g. 482 • 910, or show QR Code indicator
  const pin = packageItem.pickupPin || ""
  const formattedPin =
    pin && pin.length === 6
      ? `${pin.slice(0, 3)} • ${pin.slice(3)}`
      : pin || "Via QR Code"

  return (
    <div className="relative overflow-hidden rounded-lg bg-white border border-zinc-200/90 shadow-md max-w-sm mx-auto text-center">
      {/* Magic UI Subtle Shine Border */}
      <ShineBorder
        borderWidth={2}
        duration={8}
        shineColor={["#18181B", "#E1FF01", "#10B981"]}
      />

      {/* Apple Wallet Style Pass Content */}
      <div className="relative z-10 p-6 space-y-5">
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

        {/* Centered QR Code with High Precision Frame */}
        <div className="inline-flex flex-col items-center justify-center p-4 bg-zinc-50/80 rounded-lg border border-zinc-200/80 shadow-inner">
          <QRCodeSVG
            value={packageItem.pickupQrToken}
            size={170}
            level="H"
            includeMargin={true}
            className="rounded-lg shadow-2xs bg-white"
          />
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-2 font-mono">
            <QrCode className="size-3 text-zinc-400" />
            <span>Token: {packageItem.pickupQrToken.slice(0, 8)}...</span>
          </div>
        </div>

        {/* Wallet Notched Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-dashed border-zinc-200" />
        </div>

        {/* Spaced PIN (482 • 910) */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Código PIN da Portaria
          </span>
          <div className="inline-block px-6 py-2 rounded-lg bg-zinc-900 text-white shadow-2xs">
            <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-[#E1FF01]">
              {formattedPin}
            </span>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="pt-2 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
          <span>Apresente este passe ao porteiro no ato da retirada.</span>
        </div>
      </div>
    </div>
  )
}
