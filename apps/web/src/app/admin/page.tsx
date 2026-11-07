import { packagePort } from "@/shared/ports"
import { AuditLogTableWidget } from "@/widgets/audit-log-table/ui/audit-log-table-widget"
import { ShieldCheck, Activity, Clock, Zap, Lock } from "lucide-react"

export default async function AdminPage() {
  const events = await packagePort.listEvents()
  const packages = await packagePort.listPackages()

  const deliveredCount = packages.filter((p) => p.status === "DELIVERED").length
  const pendingCount = packages.filter((p) => p.status !== "DELIVERED").length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-xs">
            <ShieldCheck className="size-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Painel de Governança & Auditoria
            </h1>
            <p className="text-xs text-slate-500">
              Trilha imutável append-only conforme ADR-002 e LGPD &bull; Condomínio Solar das
              Palmeiras
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Lock className="size-3.5 text-indigo-600" />
            Trilha Imutável (PostgreSQL)
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Tempo Médio Check-in</span>
            <Clock className="size-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">4.2s</p>
          <p className="text-[11px] text-emerald-600 font-semibold">&bull; Meta PRD &lt; 10s</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Precisão OCR / IA</span>
            <Zap className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">95.2%</p>
          <p className="text-[11px] text-emerald-600 font-semibold">&bull; Gemini 2.5 Flash</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Retiradas Entregues</span>
            <Activity className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{deliveredCount}</p>
          <p className="text-[11px] text-slate-500">Idempotência &amp; ACID</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Extravios / Fraudes</span>
            <ShieldCheck className="size-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">0%</p>
          <p className="text-[11px] text-emerald-600 font-semibold">&bull; Validação por PIN/QR</p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Trilha de Eventos Auditáveis</h2>
            <p className="text-xs text-slate-500">
              Registros append-only em tempo real de criação, envio de push e baixas efetuadas.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            {events.length} eventos registrados
          </span>
        </div>

        <AuditLogTableWidget events={events} />
      </div>
    </div>
  )
}
