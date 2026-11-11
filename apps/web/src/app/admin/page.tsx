import { packagePort } from "@/shared/ports"
import { AdminHeader } from "@/widgets/admin-header/ui/admin-header"
import { AuditLogTableWidget } from "@/widgets/audit-log-table/ui/audit-log-table-widget"
import { ShieldCheck, Activity, Clock, Zap } from "lucide-react"

export default async function AdminPage() {
  const [events, packages] = await Promise.all([
    packagePort.listEvents(),
    packagePort.listPackages(),
  ])

  const deliveredCount = packages.filter((p) => p.status === "DELIVERED").length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <AdminHeader />

      {/* Vault-Style Bento Grid KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="rounded-lg bg-white border border-zinc-200/90 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Tempo Médio Check-in
            </span>
            <div className="size-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-zinc-950">4.2s</p>
            <p className="text-[11px] font-bold text-emerald-700 mt-0.5">&bull; Meta PRD &lt; 10s</p>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 rounded-lg overflow-hidden">
            <div className="bg-emerald-500 h-full w-[42%]" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-lg bg-white border border-zinc-200/90 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Precisão da IA
            </span>
            <div className="size-8 rounded-lg bg-zinc-900 text-[#E1FF01] flex items-center justify-center">
              <Zap className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-zinc-950">95.2%</p>
            <p className="text-[11px] font-bold text-zinc-700 mt-0.5">&bull; Gemini 2.5 Flash</p>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 rounded-lg overflow-hidden">
            <div className="bg-[#E1FF01] h-full w-[95%]" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-lg bg-white border border-zinc-200/90 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Baixas Realizadas
            </span>
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Activity className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-zinc-950">{deliveredCount}</p>
            <p className="text-[11px] font-medium text-zinc-500 mt-0.5">Validações atômicas</p>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 rounded-lg overflow-hidden">
            <div className="bg-emerald-600 h-full w-[65%]" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-lg bg-white border border-zinc-200/90 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Extravios / Fraudes
            </span>
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-emerald-700">0%</p>
            <p className="text-[11px] font-bold text-emerald-700 mt-0.5">&bull; Validação por PIN/QR</p>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 rounded-lg overflow-hidden">
            <div className="bg-emerald-500 h-full w-full" />
          </div>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <AuditLogTableWidget events={events} />
    </div>
  )
}
