"use client"

import React, { useState } from "react"
import { PackageEvent } from "@/entities/package/model/types"
import { PlusCircle, Send, CheckCircle2, XCircle, ShieldCheck, Clock, Download } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { toast } from "sonner"
import { getApiBaseUrl, getAuthToken } from "@/shared/adapters/http/http-client"

interface AuditLogTableWidgetProps {
  events: PackageEvent[]
}

const eventTypeConfig: Record<
  string,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  CREATED: {
    label: "Check-in Criado",
    badgeClass: "bg-zinc-100 text-zinc-900 border-zinc-200",
    icon: PlusCircle,
  },
  PUSH_SENT: {
    label: "Web Push Disparado",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: Send,
  },
  PUSH_FAILED: {
    label: "Falha Push",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
  DELIVERED: {
    label: "Baixa Concluída",
    badgeClass: "bg-zinc-900 text-white border-zinc-900",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelado / Devolvido",
    badgeClass: "bg-zinc-100 text-zinc-600 border-zinc-200",
    icon: XCircle,
  },
}

function maskLgpd(val: string): string {
  if (!val) return ""
  if (val.includes("@")) {
    const [user, domain] = val.split("@")
    return `${user.slice(0, 2)}****@${domain}`
  }
  if (val.length > 5) {
    return `${val.slice(0, 3)}****${val.slice(-2)}`
  }
  return val
}

export function AuditLogTableWidget({ events }: AuditLogTableWidgetProps) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExportCsv() {
    try {
      setIsExporting(true)
      const baseUrl = getApiBaseUrl()
      const token = getAuthToken()
      const res = await fetch(`${baseUrl}/audit/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Erro ao exportar relatório")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `auditoria-chegou-ai-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success("Relatório de auditoria exportado com sucesso!")
    } catch (err: unknown) {
      toast.error("Erro ao gerar exportação CSV da auditoria.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="rounded-[24px] border border-zinc-200/90 bg-white p-6 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <Clock className="size-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-950">Timeline da Trilha de Auditoria</h3>
            <p className="text-[11px] text-zinc-400">
              Registros imutáveis append-only conforme ADR-002 e LGPD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-full border border-zinc-200/80">
            {events.length} eventos
          </span>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isExporting || events.length === 0}
            onClick={handleExportCsv}
            className="rounded-full border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 gap-1.5 h-8 shadow-2xs"
          >
            <Download className="size-3.5 text-zinc-500" />
            <span>{isExporting ? "Exportando..." : "Exportar CSV"}</span>
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 text-xs text-zinc-400">
          Nenhum evento registrado ainda.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200">
          {events.map((evt) => {
            const cfg = eventTypeConfig[evt.eventType] || eventTypeConfig.CREATED
            const Icon = cfg.icon
            const formattedTime = new Date(evt.createdAt).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })

            // Format metadata in a human-readable clean way
            const metaEntries = Object.entries(evt.metadata || {})

            return (
              <div key={evt.id} className="relative flex items-start gap-4 group">
                {/* Timeline Node Icon */}
                <div className="absolute -left-6 mt-1 size-5 rounded-full bg-white border-2 border-zinc-900 flex items-center justify-center text-zinc-900">
                  <span className="size-1.5 rounded-full bg-[#E1FF01]" />
                </div>

                <div className="flex-1 rounded-lg bg-zinc-50/70 border border-zinc-200/80 p-4 hover:bg-white hover:border-zinc-300 transition-all shadow-2xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${cfg.badgeClass}`}
                      >
                        <Icon className="size-3" />
                        <span>{cfg.label}</span>
                      </span>
                      <span className="text-xs font-bold text-zinc-800">
                        {evt.actorName || "Sistema / RabbitMQ"}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-zinc-400">
                      {formattedTime}
                    </span>
                  </div>

                  {/* Clean LGPD-Compliant Metadata */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-zinc-600">
                    <span className="font-mono text-[10px] bg-white border border-zinc-200/90 px-2 py-0.5 rounded-lg text-zinc-500">
                      ID: {evt.packageId.slice(0, 8)}...
                    </span>

                    {metaEntries.map(([key, val]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 bg-white border border-zinc-200/80 px-2 py-0.5 rounded-lg text-[11px]"
                      >
                        <strong className="text-zinc-500 uppercase text-[9px] font-bold">
                          {key}:
                        </strong>
                        <span className="text-zinc-800 font-medium">
                          {typeof val === "string" ? maskLgpd(val) : JSON.stringify(val)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
