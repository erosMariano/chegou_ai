import React from "react"
import { Badge } from "@/shared/ui/badge"
import { Building2 } from "lucide-react"
import { cn } from "@/shared/lib/utils"

interface UnitBadgeProps {
  block: string
  number: string
  className?: string
}

export function UnitBadge({ block, number, className }: UnitBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold text-xs px-2.5 py-0.5 border border-slate-200 bg-slate-100 text-slate-800",
        className
      )}
    >
      <Building2 className="size-3 text-slate-500" />
      <span>
        Bloco {block} &bull; Apto {number}
      </span>
    </Badge>
  )
}

