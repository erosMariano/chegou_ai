"use client"

import React from "react"
import { QRCodeSVG } from "qrcode.react"
import { ShineBorder } from "@/shared/ui/shine-border"
import { PackageItem } from "@/entities/package/model/types"
import { StatusBadge } from "@/shared/ui/status-badge"
import { Sparkles, Shield, Clock, Truck, QrCode } from "lucide-react"

interface ResidentQrWidgetProps {
  packageItem: PackageItem
}

export function ResidentQrWidget({ packageItem }: ResidentQrWidgetProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm p-6 max-w-md mx-auto text-center">
      {/* Magic UI Hero Moment: Subtle animated Shine Border around Resident QR Card */}
      <ShineBorder
        borderWidth={2}
        duration={8}
        shineColor={["#4f46e5", "#06b6d4", "#10b981"]}
      />

      <div className="relative z-10 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Chegou Encomenda
            </span>
            <h3 className="text-base font-bold text-slate-900">{packageItem.recipientNameRaw}</h3>
          </div>
          <StatusBadge status={packageItem.status} />
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="font-semibold text-slate-800">
            Bloco {packageItem.unit?.block} &bull; Apto {packageItem.unit?.number}
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1">
            <Truck className="size-3.5 text-slate-400" />
            {packageItem.carrier}
          </span>
        </div>

        {/* QR Code Container with subtle frame */}
        <div className="inline-flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-inner">
          <QRCodeSVG
            value={packageItem.pickupQrToken}
            size={180}
            level="H"
            includeMargin={true}
            className="rounded-lg shadow-2xs"
          />
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 font-mono">
            <QrCode className="size-3 text-indigo-500" />
            <span>Token: {packageItem.pickupQrToken.slice(0, 8)}...</span>
          </div>
        </div>

        {/* PIN de Retirada */}
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
            Código PIN para o Porteiro
          </p>
          <div className="inline-block px-6 py-2 rounded-xl bg-indigo-50 border border-indigo-200">
            <span className="font-mono text-3xl font-extrabold tracking-widest text-indigo-700">
              {packageItem.pickupPin}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-center gap-2">
          <Shield className="size-3.5 text-emerald-600" />
          <span>Apresente este código na portaria para retirar sua encomenda.</span>
        </div>
      </div>
    </div>
  )
}

