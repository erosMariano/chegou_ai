"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/shared/ui/button"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[Chegou.AI Error Boundary]", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-[#F4F4F3] text-zinc-900">
      <div className="w-full max-w-md rounded-[24px] border border-zinc-200/90 bg-white p-8 shadow-xs text-center space-y-5">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mx-auto">
          <AlertTriangle className="size-7" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-950">
            Algo inesperado aconteceu
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Ocorreu uma falha temporária ao carregar esta tela. Tente novamente em instantes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          <Button
            type="button"
            onClick={reset}
            className="w-full sm:w-auto h-10 px-5 rounded-full bg-zinc-900 hover:bg-black text-white font-bold text-xs gap-2"
          >
            <RotateCcw className="size-3.5 text-[#E1FF01]" />
            Tentar novamente
          </Button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center h-10 px-5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-bold text-xs transition-colors"
          >
            Ir para o Início
          </Link>
        </div>
      </div>
    </div>
  )
}

