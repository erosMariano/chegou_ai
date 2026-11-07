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
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-zinc-300 bg-white p-8 text-center transition-all hover:border-zinc-900 cursor-pointer group shadow-2xs"
    >
      {/* Magic UI Border Beam when active scanning */}
      {isScanning && (
        <BorderBeam
          size={180}
          duration={3}
          colorFrom="#18181B"
          colorTo="#E1FF01"
          borderWidth={2.5}
        />
      )}

      {/* Animated laser scanning line effect */}
      {isScanning && (
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#E1FF01] to-transparent shadow-[0_0_14px_#E1FF01] animate-[scan_1.5s_ease-in-out_infinite] pointer-events-none top-0 z-20" />
      )}

      <div className="relative z-10 flex flex-col items-center gap-3.5">
        <div className="size-14 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
          {hasExtracted ? (
            <CheckCircle2 className="size-7 text-[#E1FF01] animate-in zoom-in-50" />
          ) : isScanning ? (
            <Sparkles className="size-7 text-[#E1FF01] animate-spin" />
          ) : (
            <Camera className="size-7 text-[#E1FF01]" />
          )}
        </div>

        <div className="space-y-1">
          <h4 className="font-extrabold text-zinc-950 text-base sm:text-lg">
            {isScanning
              ? "Gemini 2.5 Flash analisando etiqueta..."
              : hasExtracted
              ? "Etiqueta Lida com Sucesso!"
              : "Apontar Câmera ou Capturar Etiqueta"}
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm">
            {isScanning
              ? "Processando foto na memória RAM (LGPD: sem gravação em disco)."
              : hasExtracted
              ? "Dados extraídos automaticamente. Verifique os dados abaixo antes de salvar."
              : "Toque aqui para simular a foto da encomenda. A IA extrairá destinatário, bloco, apto e rastreio."}
          </p>
        </div>

        {!isScanning && !hasExtracted && (
          <button
            type="button"
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-black transition-colors"
          >
            <Sparkles className="size-3.5 text-[#E1FF01]" />
            <span>Simular Captura da Câmera</span>
          </button>
        )}
      </div>
    </div>
  )
}
