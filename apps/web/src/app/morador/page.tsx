import { packagePort } from "@/shared/ports"
import { ResidentQrWidget } from "@/widgets/resident-qr-widget/ui/resident-qr-widget"
import { PushSubscriptionBanner } from "@/features/push-subscription/ui/push-subscription-banner"
import { PackageCard } from "@/entities/package/ui/package-card"
import { PackageOpen, Sparkles } from "lucide-react"

export default async function MoradorPage() {
  const allPackages = await packagePort.listPackages()
  // Mariana Costa Silva: Bloco B - 402
  const residentPackages = allPackages.filter(
    (p) => p.unit?.block === "B" && p.unit?.number === "402"
  )
  const activePackage =
    residentPackages.find((p) => p.status === "NOTIFIED" || p.status === "RECEIVED") ||
    residentPackages[0]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Resident Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-tight">
              Olá, Mariana Costa 👋
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              Moradora
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Bloco B &bull; Apartamento 402 &bull; Condomínio Solar das Palmeiras
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-white px-3 py-1.5 rounded-lg border border-zinc-200/90 shadow-2xs self-start sm:self-auto">
          <Sparkles className="size-3 text-[#E1FF01] fill-zinc-900" />
          <span>Notificações Automáticas</span>
        </div>
      </div>

      {/* Web Push Banner */}
      <PushSubscriptionBanner />

      {/* Apple Wallet Style Digital Pass */}
      {activePackage ? (
        <div className="py-2">
          <ResidentQrWidget packageItem={activePackage} />
        </div>
      ) : (
        <div className="text-center py-14 bg-white rounded-lg border border-zinc-200/90 p-8 space-y-3 shadow-2xs">
          <div className="size-12 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <PackageOpen className="size-6" />
          </div>
          <p className="text-sm font-bold text-zinc-900">Nenhum pacote pendente para sua unidade</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Quando o porteiro receber uma entrega para o Bloco B 402, seu passe de retirada aparecerá aqui.
          </p>
        </div>
      )}

      {/* Package History */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Histórico de Encomendas da Unidade
          </h2>
          <span className="text-[11px] font-semibold text-zinc-400">
            {residentPackages.length} registro(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {residentPackages.map((pkg) => (
            <PackageCard key={pkg.id} packageItem={pkg} />
          ))}
        </div>
      </div>
    </div>
  )
}
