"use client"

import React from "react"
import { Search, Filter } from "lucide-react"
import { Input } from "@/shared/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui/select"

interface AuditFilterBarProps {
  search: string
  onSearchChange: (val: string) => void
  status: string
  onStatusChange: (val: string) => void
}

export function AuditFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: AuditFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-3 size-4 text-zinc-400 pointer-events-none" />
        <Input
          placeholder="Buscar por morador, código de rastreio ou transportadora..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 rounded-lg border-zinc-200/90 bg-white pl-10 pr-4 text-xs sm:text-sm text-zinc-900 shadow-2xs placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Select value={status} onValueChange={(val) => onStatusChange(val ?? "ALL")}>
          <SelectTrigger className="h-10 min-w-[200px] rounded-lg border border-zinc-200/90 bg-white px-3 text-xs font-bold text-zinc-700 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <Filter className="size-3.5 text-zinc-500" />
              <SelectValue placeholder="Todos os Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="ALL">Todos os Status</SelectItem>
            <SelectItem value="RECEIVED">Recebido na Portaria</SelectItem>
            <SelectItem value="NOTIFIED">Notificado</SelectItem>
            <SelectItem value="DELIVERED">Entregue</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
