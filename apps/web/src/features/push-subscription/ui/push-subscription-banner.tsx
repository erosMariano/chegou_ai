"use client"

import React, { useState } from "react"
import { Bell, CheckCircle2, Shield } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { toast } from "sonner"

export function PushSubscriptionBanner() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubscribe() {
    setIsLoading(true)
    // Simulate Service Worker PushSubscription creation + VAPID key exchange
    setTimeout(() => {
      setIsSubscribed(true)
      setIsLoading(false)
      toast.success("Notificações Push ativadas com sucesso!", {
        description: "Você receberá alertas em tempo real quando chegar uma encomenda.",
      })
    }, 600)
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Web Push Ativo:</strong> Alertas em tempo real ativados para este dispositivo.
          </span>
        </div>
        <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
          VAPID OK
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-slate-800">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
          <Bell className="size-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-indigo-950">
            Receba aviso imediato quando seu pacote chegar
          </h4>
          <p className="text-xs text-indigo-700">
            Ative o Web Push no seu navegador e retire com o QR Code mesmo sem abrir o app.
          </p>
        </div>
      </div>
      <Button
        onClick={handleSubscribe}
        disabled={isLoading}
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shrink-0 self-end sm:self-center"
      >
        {isLoading ? "Ativando..." : "Ativar Notificações"}
      </Button>
    </div>
  )
}

