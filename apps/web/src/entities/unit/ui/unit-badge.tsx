import React from "react"
import { Building2 } from "lucide-react"
import { cn } from "@/shared/lib/utils"

interface UnitBadgeProps {
  block: string
  number: string
  className?: string
}

export function UnitBadge({ block, number, className }: UnitBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200/90 shadow-2xs select-none",
        className
      )}
    >
      <Building2 className="size-3 text-zinc-500" />
      <span>
        {block ? `Bl. ${block} • ` : ""}Apto {number}
      </span>
    </span>
  )
}
