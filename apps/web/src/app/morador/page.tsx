import { packagePort } from "@/shared/ports"
import { ResidentQrWidget } from "@/widgets/resident-qr-widget/ui/resident-qr-widget"
import { PushSubscriptionBanner } from "@/features/push-subscription/ui/push-subscription-banner"
import { PackageCard } from "@/entities/package/ui/package-card"
import { ResidentAvatar } from "@/entities/resident/ui/resident-avatar"
import { User, Bell, PackageOpen } from "lucide-react"

export default async function MoradorPage() {
  const allPackages = await packagePort.listPackages()
  // Mariana Costa Silva's unit is Bloco B - 402
  const residentPackages = allPackages.filter(
    (p) => p.unit?.block === "B" && p.unit?.number === "402"
  )
  const activePackage =
    residentPackages.find((p) => p.status === "NOTIFIED" || p.status === "RECEIVED") ||
    residentPackages[0]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Resident Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <ResidentAvatar name="Mariana Costa Silva" className="size-11 text-sm font-bold" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Olá, Mariana Costa Silva
            </h1>
            <p className="text-xs text-slate-500">
              Bloco B &bull; Apartamento 402 &bull; Condomínio Solar das Palmeiras
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            Morador Conectado
          </span>
        </div>
      </div>

      {/* Web Push Banner */}
      <PushSubscriptionBanner />

      {/* Hero QR Code Card */}
      {activePackage ? (
        <div className="py-2">
          <ResidentQrWidget packageItem={activePackage} />
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <PackageOpen className="size-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">Você não tem pacotes pendentes!</p>
          <p className="text-xs text-slate-500">
            Assim que uma nova entrega der entrada na portaria, você receberá uma notificação aqui.
          </p>
        </div>
      )}

      {/* Package History */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Histórico de Encomendas da Unidade
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {residentPackages.map((pkg) => (
            <PackageCard key={pkg.id} packageItem={pkg} />
          ))}
        </div>
      </div>
    </div>
  )
}
