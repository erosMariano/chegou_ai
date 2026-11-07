import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { StatusBadge } from "@/shared/ui/status-badge"
import { UnitBadge } from "@/entities/unit/ui/unit-badge"
import { PackageItem } from "@/entities/package/model/types"
import { Truck, Clock, Sparkles } from "lucide-react"

interface PackageCardProps {
  packageItem: PackageItem
  onClick?: () => void
}

export function PackageCard({ packageItem, onClick }: PackageCardProps) {
  const formattedTime = new Date(packageItem.receivedAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Card
      onClick={onClick}
      className="border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-xs cursor-pointer"
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          {packageItem.unit && (
            <UnitBadge block={packageItem.unit.block} number={packageItem.unit.number} />
          )}
          {packageItem.aiConfidenceScore && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Sparkles className="size-3" />
              IA {Math.round(packageItem.aiConfidenceScore * 100)}%
            </span>
          )}
        </div>
        <StatusBadge status={packageItem.status} />
      </CardHeader>
      <CardContent>
        <CardTitle className="text-base font-semibold text-slate-900 mb-1">
          {packageItem.recipientNameRaw}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
          <div className="flex items-center gap-1">
            <Truck className="size-3.5 text-slate-400" />
            <span>{packageItem.carrier || "Transportadora não informada"}</span>
          </div>
          {packageItem.trackingCode && (
            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
              {packageItem.trackingCode}
            </span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Clock className="size-3.5 text-slate-400" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

