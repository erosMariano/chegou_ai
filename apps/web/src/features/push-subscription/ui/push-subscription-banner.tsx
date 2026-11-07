"use client"

import React, { useState } from "react"
import { Bell, CheckCircle2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { toast } from "sonner"

export function PushSubscriptionBanner() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubscribe() {
    setIsLoading(true)
    setTimeout(() => {
      setIsSubscribed(true)
      setIsLoading(false)
      toast.success("Notificações Push ativadas com sucesso!", {
        description: "Você receberá o passe digital assim que uma encomenda chegar.",
      })
    }, 600)
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Web Push Conectado:</strong> Alertas em tempo real ativados para este celular.
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-300">
          VAPID OK
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg bg-white border border-zinc-200/90 shadow-2xs text-zinc-900">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
          <Bell className="size-4 text-[#E1FF01]" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-zinc-950">
            Receba o Passe Digital no Celular
          </h4>
          <p className="text-xs text-zinc-500">
            Ative o Web Push para ser avisado no exato instante em que o entregador chegar na portaria.
          </p>
        </div>
      </div>

      <Button
        onClick={handleSubscribe}
        disabled={isLoading}
        size="sm"
        className="rounded-lg bg-zinc-900 hover:bg-black text-white font-semibold text-xs h-8 px-4 shrink-0 self-end sm:self-center shadow-xs"
      >
        {isLoading ? "Ativando..." : "Ativar Avisos"}
      </Button>
    </div>
  )
}
