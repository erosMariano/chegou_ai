import React from "react"
import { Badge } from "@/shared/ui/badge"
import { Package, Bell, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/shared/lib/utils"

export type PackageStatus =
  | "RECEIVED"
  | "NOTIFIED"
  | "NOTIFICATION_FAILED"
  | "DELIVERED"
  | "CANCELLED"

interface StatusBadgeProps {
  status: PackageStatus
  className?: string
  showIcon?: boolean
}

const statusConfig: Record<
  PackageStatus,
  {
    label: string
    variantClass: string
    icon: React.ComponentType<{ className?: string }>
    dotColor?: string
  }
> = {
  RECEIVED: {
    label: "Aguardando",
    variantClass: "bg-amber-50/90 text-amber-800 border-amber-200 hover:bg-amber-100",
    icon: Package,
    dotColor: "bg-amber-500",
  },
  NOTIFIED: {
    label: "Notificado",
    variantClass: "bg-zinc-100 text-zinc-900 border-zinc-200 hover:bg-zinc-200",
    icon: Bell,
    dotColor: "bg-[#E1FF01]",
  },
  NOTIFICATION_FAILED: {
    label: "Falha Push",
    variantClass: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
    icon: AlertTriangle,
    dotColor: "bg-rose-500",
  },
  DELIVERED: {
    label: "Entregue",
    variantClass: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
    icon: CheckCircle2,
    dotColor: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Cancelado",
    variantClass: "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200",
    icon: XCircle,
    dotColor: "bg-zinc-400",
  },
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.RECEIVED
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-lg border transition-colors shadow-2xs select-none",
        config.variantClass,
        className
      )}
    >
      {config.dotColor && (
        <span
          className={cn(
            "size-1.5 rounded-full shrink-0",
            config.dotColor,
            status === "NOTIFIED" && "ring-1 ring-zinc-950/20"
          )}
        />
      )}
      {showIcon && <Icon className="size-3 shrink-0" />}
      <span>{config.label}</span>
    </Badge>
  )
}
