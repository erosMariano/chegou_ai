"use client"

import React from "react"
import { Search, Filter } from "lucide-react"
import { Input } from "@/shared/ui/input"

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
        <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
        <Input
          placeholder="Buscar por morador, código de rastreio ou transportadora..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-white border-slate-200 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="size-4 text-slate-400 shrink-0" />
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
        >
          <option value="ALL">Todos os Status</option>
          <option value="RECEIVED">Recebido na Portaria</option>
          <option value="NOTIFIED">Notificado</option>
          <option value="DELIVERED">Entregue</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>
    </div>
  )
}

