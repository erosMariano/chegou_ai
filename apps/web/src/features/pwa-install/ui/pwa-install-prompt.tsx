"use client"

import React, { useState, useEffect, useSyncExternalStore } from "react"
import { Download, Share2, PlusSquare, X, Check } from "lucide-react"
import { Button } from "@/shared/ui/button"

const emptySubscribe = () => () => {}

function getIsStandaloneSnapshot(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error navigator.standalone exists on iOS Safari
    Boolean(window.navigator.standalone)
  )
}

function getIsIosSnapshot(): boolean {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const isIos = useSyncExternalStore(emptySubscribe, getIsIosSnapshot, () => false)
  const isStandalone = useSyncExternalStore(emptySubscribe, getIsStandaloneSnapshot, () => false)
  const [dismissed, setDismissed] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Handler para Chrome/Edge/Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  async function handleInstallClick() {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  // Não exibe se já estiver rodando como standalone ou se foi dispensado
  if (isStandalone || isInstalled || dismissed) {
    return null
  }

  // Banner para Android / Desktop Chrome quando disparar o prompt
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-zinc-900 text-white p-4 rounded-xl shadow-2xl border border-zinc-700 animate-in slide-in-from-bottom-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-[#E1FF01] text-zinc-950 flex items-center justify-center shrink-0 font-extrabold text-sm shadow-xs">
            <Download className="size-5" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-white">Instalar o Chegou.AI</h5>
            <p className="text-[11px] text-zinc-400">
              Instale na tela inicial para alertas em tela cheia e acesso rápido.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="h-8 px-3 rounded-lg bg-[#E1FF01] hover:bg-[#d4f000] text-zinc-950 font-bold text-xs shadow-xs"
          >
            Instalar
          </Button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="size-7 rounded-lg text-zinc-400 hover:text-white flex items-center justify-center"
            title="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    )
  }

  // Instrução amigável para iOS Safari (onde beforeinstallprompt não existe)
  if (isIos && !isStandalone) {
    return (
      <div className="mx-auto max-w-3xl mb-4 p-3 rounded-lg bg-zinc-900 text-zinc-100 border border-zinc-800 text-xs shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-[#E1FF01] animate-pulse shrink-0" />
          <div className="space-y-0.5">
            <p className="font-semibold text-[11px] text-white">
              Dica para iPhone: Adicione o Chegou.AI à Tela de Início
            </p>
            <p className="text-[10px] text-zinc-400 flex items-center gap-1">
              Toque em Compartilhar <Share2 className="size-3 inline text-zinc-300" /> e depois em &quot;Adicionar à Tela de Início&quot; <PlusSquare className="size-3 inline text-zinc-300" /> para receber notificações.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-zinc-400 hover:text-white p-1"
        >
          <X className="size-3.5" />
        </button>
      </div>
    )
  }

  return null
}

