"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { packagePort } from "@/shared/ports"
import { PackageItem } from "@/entities/package/model/types"
import { ResidentQrWidget } from "@/widgets/resident-qr-widget/ui/resident-qr-widget"
import { PushSubscriptionBanner } from "@/features/push-subscription/ui/push-subscription-banner"
import { PackageCard } from "@/entities/package/ui/package-card"
import { useAuth } from "@/entities/user/ui/auth-provider"
import { Button } from "@/shared/ui/button"
import {
  PackageOpen,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

interface ResidentPortalViewProps {
  initialPackages: PackageItem[]
}

export function ResidentPortalView({ initialPackages }: ResidentPortalViewProps) {
  const { user } = useAuth()
  const [packages, setPackages] = useState<PackageItem[]>(initialPackages)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [justDeliveredPackage, setJustDeliveredPackage] = useState<PackageItem | null>(null)

  // Guardar IDs pendentes para detectar quando o porteiro der baixa
  const previousPendingIdsRef = useRef<Set<string>>(
    new Set(
      initialPackages
        .filter((p) => p.status === "RECEIVED" || p.status === "NOTIFIED")
        .map((p) => p.id)
    )
  )

  const fetchPackages = useCallback(async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true)
      const all = await packagePort.listPackages()

      // Filtra para a unidade do morador logado (ou padrão Bloco B - 402 se demo)
      const targetBlock = user?.unit?.block || "B"
      const targetNumber = user?.unit?.number || "402"

      const residentPkgs = all.filter(
        (p) =>
          p.unit?.block?.toUpperCase() === targetBlock.toUpperCase() &&
          p.unit?.number === targetNumber
      )

      // Detectar se algum pacote que antes estava pendente agora foi entregue
      for (const pkg of residentPkgs) {
        if (
          previousPendingIdsRef.current.has(pkg.id) &&
          pkg.status === "DELIVERED"
        ) {
          setJustDeliveredPackage(pkg)
          toast.success("🎉 Baixa Confirmada pela Portaria!", {
            description: `Sua encomenda de ${pkg.carrier || "Transportadora"} foi entregue com sucesso!`,
            duration: 6000,
          })
          previousPendingIdsRef.current.delete(pkg.id)
        }
      }

      // Atualiza o set de pendentes
      previousPendingIdsRef.current = new Set(
        residentPkgs
          .filter((p) => p.status === "RECEIVED" || p.status === "NOTIFIED")
          .map((p) => p.id)
      )

      setPackages(residentPkgs)
    } catch (err) {
      console.warn("Erro ao atualizar encomendas do morador:", err)
    } finally {
      if (isManual) setIsRefreshing(false)
    }
  }, [user])

  // Polling automático a cada 3 segundos enquanto a tela estiver em foco
  useEffect(() => {
    fetchPackages()

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchPackages()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [fetchPackages])

  // Pacote pendente que requer apresentação do passe na portaria
  const activePendingPackage = packages.find(
    (p) => p.status === "NOTIFIED" || p.status === "RECEIVED" || p.status === "NOTIFICATION_FAILED"
  )

  // Encomendas já entregues
  const deliveredPackages = packages.filter((p) => p.status === "DELIVERED")

  const residentName = user?.name || "Mariana Costa"
  const residentBlock = user?.unit?.block || "B"
  const residentNumber = user?.unit?.number || "402"

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Resident Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-tight">
              Olá, {residentName} 👋
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              Morador
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Bloco {residentBlock} &bull; Apartamento {residentNumber} &bull; Condomínio Solar das Palmeiras
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPackages(true)}
            disabled={isRefreshing}
            className="text-xs h-8 gap-1.5 rounded-lg bg-white shadow-2xs border-zinc-200"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-zinc-900" : "text-zinc-500"}`} />
            <span>{isRefreshing ? "Atualizando..." : "Atualizar"}</span>
          </Button>

          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sincronizado ao vivo</span>
          </div>
        </div>
      </div>

      {/* Web Push Banner */}
      <PushSubscriptionBanner />

      {/* Alerta de Baixa Recém-Confirmada em Tempo Real */}
      {justDeliveredPackage && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start gap-3 shadow-xs animate-in slide-in-from-top-2">
          <div className="size-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="flex-1 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-emerald-950 text-sm">
                Baixa Confirmada pelo Porteiro!
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                Retirada Concluída
              </span>
            </div>
            <p className="text-emerald-800">
              A encomenda de <span className="font-bold">{justDeliveredPackage.carrier || "Transportadora"}</span> foi retirada com sucesso na portaria.
            </p>
            <p className="text-[11px] text-emerald-700 font-mono">
              Rastreio: {justDeliveredPackage.trackingCode || "Local"} &bull; Entregue agora
            </p>
          </div>
        </div>
      )}

      {/* Apple Wallet Style Digital Pass (Apenas se houver encomenda PENDENTE) */}
      {activePendingPackage ? (
        <div className="py-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#E1FF01] ring-2 ring-zinc-900" />
              Passe Ativo para Retirada
            </span>
            <span className="text-[11px] text-zinc-400">
              Apresente o PIN ou QR Code na portaria
            </span>
          </div>

          <ResidentQrWidget packageItem={activePendingPackage} />
        </div>
      ) : (
        /* Empty State: Nenhuma encomenda pendente */
        <div className="text-center py-12 bg-white rounded-lg border border-zinc-200/90 p-8 space-y-3 shadow-2xs">
          <div className="size-14 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
            <ShieldCheck className="size-7" />
          </div>
          <h3 className="text-base font-extrabold text-zinc-950">
            Tudo em dia! Nenhuma encomenda aguardando retirada
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Assim que uma nova entrega for recebida pelo porteiro para o Bloco {residentBlock} - Apartamento {residentNumber}, seu passe digital e PIN de retirada aparecerão aqui em tempo real.
          </p>
        </div>
      )}

      {/* Histórico de Encomendas da Unidade */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Histórico da Unidade ({packages.length})
          </h2>
          <span className="text-[11px] font-semibold text-zinc-400">
            {deliveredPackages.length} entregue(s) &bull; {packages.length - deliveredPackages.length} pendente(s)
          </span>
        </div>

        {packages.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6">
            Nenhuma encomenda registrada para esta unidade ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} packageItem={pkg} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

