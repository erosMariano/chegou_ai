"use client"

import React from "react"
import { BorderBeam } from "@/shared/ui/border-beam"
import { Camera, Sparkles, CheckCircle2 } from "lucide-react"

interface ScannerHeroProps {
  isScanning: boolean
  hasExtracted: boolean
  onTriggerScan: () => void
}

export function ScannerHero({ isScanning, hasExtracted, onTriggerScan }: ScannerHeroProps) {
  return (
    <div
      onClick={!isScanning ? onTriggerScan : undefined}
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-b from-slate-50 to-indigo-50/30 p-8 text-center transition-all hover:border-indigo-400 cursor-pointer group"
    >
      {/* Magic UI Border Beam when active scanning */}
      {isScanning && (
        <BorderBeam
          size={160}
          duration={3}
          colorFrom="#4f46e5"
          colorTo="#06b6d4"
          borderWidth={2.5}
        />
      )}

      {/* Animated laser scanning line effect */}
      {isScanning && (
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_12px_#6366f1] animate-[scan_1.5s_ease-in-out_infinite] pointer-events-none top-0" />
      )}

      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 group-hover:scale-105 group-hover:border-indigo-300 transition-transform">
          {hasExtracted ? (
            <CheckCircle2 className="size-7 text-emerald-600 animate-in zoom-in-50" />
          ) : isScanning ? (
            <Sparkles className="size-7 text-indigo-600 animate-spin" />
          ) : (
            <Camera className="size-7 text-indigo-600" />
          )}
        </div>

        <div className="space-y-1">
          <h4 className="font-semibold text-slate-900 text-base">
            {isScanning
              ? "Gemini 2.5 Flash analisando etiqueta..."
              : hasExtracted
              ? "Etiqueta lida com sucesso!"
              : "Escanear Etiqueta com IA"}
          </h4>
          <p className="text-xs text-slate-500 max-w-xs">
            {isScanning
              ? "Identificando destinatário, bloco, apartamento e transportadora em memória."
              : hasExtracted
              ? "Confira os dados extraídos abaixo antes de confirmar o check-in."
              : "Toque aqui para simular a captura da foto da encomenda e extrair dados automaticamente."}
          </p>
        </div>

        {!isScanning && !hasExtracted && (
          <button
            type="button"
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Sparkles className="size-3.5" />
            Simular Captura de Foto
          </button>
        )}
      </div>
    </div>
  )
}

