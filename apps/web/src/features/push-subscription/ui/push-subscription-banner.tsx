"use client"

import React, { useState, useEffect } from "react"
import { Bell, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { toast } from "sonner"
import { httpPost } from "@/shared/adapters/http/http-client"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushSubscriptionBanner() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [insecureNotice, setInsecureNotice] = useState(false)

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  useEffect(() => {
    if (typeof window === "undefined") return

    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    setIsSupported(supported)

    if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      setInsecureNotice(true)
    }

    if (supported && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (sub && Notification.permission === "granted") {
            setIsSubscribed(true)
          }
        })
        .catch(() => {})
    }
  }, [])

  async function handleSubscribe() {
    if (!vapidPublicKey) {
      toast.error("Chave VAPID não configurada no front-end.")
      return
    }

    if (!isSupported) {
      toast.error("Este navegador não suporta Web Push Notifications.")
      return
    }

    if (insecureNotice) {
      toast.warning("Aviso de Contexto HTTP", {
        description:
          "Notificações no celular exigem HTTPS ou PWA instalado. Em localhost ou via túnel HTTPS o disparo é imediato.",
      })
    }

    try {
      setIsLoading(true)

      // 1. Pedir permissão ao usuário
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        toast.error("Permissão de notificações não concedida pelo usuário.")
        return
      }

      // 2. Registrar Service Worker se ainda não estiver ativo
      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      // 3. Obter ou criar inscrição no PushManager
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        })
      }

      // 4. Enviar chaves p256dh e auth para o backend
      const subJson = subscription.toJSON()
      if (subJson.endpoint && subJson.keys) {
        try {
          await httpPost("/residents/me/push-subscriptions", {
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
            },
            userAgent: navigator.userAgent,
          })
        } catch {
          console.warn("[PushSubscription] Inscrição salva localmente; backend responderá em modo híbrido.")
        }
      }

      setIsSubscribed(true)
      toast.success("Web Push ativado com sucesso!", {
        description: "Você receberá o passe digital e alertas da portaria neste dispositivo.",
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao ativar notificações"
      console.error("[PushSubscription] Error:", err)
      toast.error(`Falha ao ativar notificações: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Web Push Conectado:</strong> Alertas em tempo real ativados para este dispositivo.
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-300 shrink-0">
          VAPID ATIVO
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
          <h4 className="text-xs sm:text-sm font-bold text-zinc-950 flex items-center gap-1.5">
            Receba o Código PIN no Celular
            {insecureNotice && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                <AlertTriangle className="size-3" /> HTTP LAN
              </span>
            )}
          </h4>
          <p className="text-xs text-zinc-500">
            Ative o Web Push para ser avisado no exato instante em que uma encomenda chegar para sua unidade.
          </p>
        </div>
      </div>

      <Button
        onClick={handleSubscribe}
        disabled={isLoading}
        size="sm"
        className="rounded-lg bg-zinc-900 hover:bg-black text-white font-semibold text-xs h-8 px-4 shrink-0 self-end sm:self-center shadow-xs"
      >
        <ShieldCheck className="size-3.5 text-[#E1FF01] mr-1.5" />
        {isLoading ? "Ativando..." : "Ativar Avisos"}
      </Button>
    </div>
  )
}
