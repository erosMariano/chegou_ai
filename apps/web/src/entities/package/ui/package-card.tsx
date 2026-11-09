import React from "react"
import { StatusBadge } from "@/shared/ui/status-badge"
import { UnitBadge } from "@/entities/unit/ui/unit-badge"
import { PackageItem } from "@/entities/package/model/types"
import { Truck, Clock, Sparkles, Ban } from "lucide-react"
import { Button } from "@/shared/ui/button"

interface PackageCardProps {
  packageItem: PackageItem
  onClick?: () => void
  onCancel?: (pkg: PackageItem) => void
}

export function PackageCard({ packageItem, onClick, onCancel }: PackageCardProps) {
  const formattedTime = new Date(packageItem.receivedAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const canCancel =
    (packageItem.status === "RECEIVED" || packageItem.status === "NOTIFIED") && !!onCancel

  return (
    <div
      onClick={onClick}
      className="rounded-lg border border-zinc-200/90 bg-white p-5 shadow-2xs hover:border-zinc-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3.5 group relative"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {packageItem.unit && (
            <UnitBadge block={packageItem.unit.block} number={packageItem.unit.number} />
          )}
          {packageItem.aiConfidenceScore && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/80">
              <Sparkles className="size-2.5 text-emerald-600" />
              IA {Math.round(packageItem.aiConfidenceScore * 100)}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={packageItem.status} />
          {canCancel && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                onCancel(packageItem)
              }}
              className="size-6 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 p-0"
              title="Cancelar ou devolver pacote"
            >
              <Ban className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm sm:text-base font-bold text-zinc-950 group-hover:text-zinc-800 transition-colors line-clamp-1">
          {packageItem.recipientNameRaw}
        </h4>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
          <Truck className="size-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">{packageItem.carrier || "Transportadora local"}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
        <span className="font-mono text-[11px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-lg font-semibold border border-zinc-200/60">
          {packageItem.trackingCode}
        </span>
        <div className="flex items-center gap-1 text-[11px]">
          <Clock className="size-3 text-zinc-400" />
          <span>{formattedTime}</span>
        </div>
      </div>
    </div>
  )
}
