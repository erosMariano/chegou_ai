"use client"

import React from "react"
import { PackageEvent } from "@/entities/package/model/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { Badge } from "@/shared/ui/badge"
import { ShieldCheck, Send, CheckCircle2, XCircle, PlusCircle } from "lucide-react"

interface AuditLogTableWidgetProps {
  events: PackageEvent[]
}

const eventTypeConfig: Record<
  string,
  { label: string; variantClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  CREATED: {
    label: "Check-in Criado",
    variantClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: PlusCircle,
  },
  PUSH_SENT: {
    label: "Notificação Enviada",
    variantClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Send,
  },
  PUSH_FAILED: {
    label: "Falha de Notificação",
    variantClass: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
  DELIVERED: {
    label: "Baixa Concluída",
    variantClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelado",
    variantClass: "bg-slate-100 text-slate-700 border-slate-200",
    icon: XCircle,
  },
}

export function AuditLogTableWidget({ events }: AuditLogTableWidgetProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      <Table>
        <TableHeader className="bg-slate-50 border-b border-slate-200">
          <TableRow>
            <TableHead className="text-xs font-semibold text-slate-700">Horário</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700">Evento</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700">Responsável</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700">ID da Encomenda</TableHead>
            <TableHead className="text-xs font-semibold text-slate-700">Metadados / Trilha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-sm text-slate-400">
                Nenhum evento registrado ainda.
              </TableCell>
            </TableRow>
          ) : (
            events.map((evt) => {
              const cfg = eventTypeConfig[evt.eventType] || eventTypeConfig.CREATED
              const Icon = cfg.icon
              const formattedTime = new Date(evt.createdAt).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })

              return (
                <TableRow key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="text-xs font-mono text-slate-600 whitespace-nowrap">
                    {formattedTime}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${cfg.variantClass}`}
                    >
                      <Icon className="size-3" />
                      <span>{cfg.label}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-800">
                    {evt.actorName || "Sistema / Worker"}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-500">
                    {evt.packageId.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {JSON.stringify(evt.metadata)}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

