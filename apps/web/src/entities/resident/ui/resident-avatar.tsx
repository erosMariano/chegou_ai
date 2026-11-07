import React from "react"
import { cn } from "@/shared/lib/utils"

interface ResidentAvatarProps {
  name: string
  className?: string
}

export function ResidentAvatar({ name, className }: ResidentAvatarProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")

  return (
    <div
      className={cn(
        "size-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-medium text-xs border border-indigo-200 select-none",
        className
      )}
    >
      {initials || "U"}
    </div>
  )
}

