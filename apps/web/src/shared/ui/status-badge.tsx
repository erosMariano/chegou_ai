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
  }
> = {
  RECEIVED: {
    label: "Recebido na Portaria",
    variantClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    icon: Package,
  },
  NOTIFIED: {
    label: "Notificado ao Morador",
    variantClass: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
    icon: Bell,
  },
  NOTIFICATION_FAILED: {
    label: "Falha de Notificação",
    variantClass: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    icon: AlertTriangle,
  },
  DELIVERED: {
    label: "Entregue ao Morador",
    variantClass: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelado / Devolvido",
    variantClass: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200",
    icon: XCircle,
  },
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.RECEIVED
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors",
        config.variantClass,
        className
      )}
    >
      {showIcon && <Icon className="size-3.5 shrink-0" />}
      <span>{config.label}</span>
    </Badge>
  )
}

