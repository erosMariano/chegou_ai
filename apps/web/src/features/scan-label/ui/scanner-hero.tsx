"use client"

import React, { useRef } from "react"
import { BorderBeam } from "@/shared/ui/border-beam"
import { Camera, Sparkles, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react"
import { compressImageForOcr } from "@/shared/lib/image-compressor"

interface ScannerHeroProps {
  isScanning: boolean
  hasExtracted: boolean
  isAddressMismatch?: boolean
  previewUrl: string | null
  onCaptureImage: (base64Image: string, mimeType: string) => void
  onSimulateScan: () => void
}

export function ScannerHero({
  isScanning,
  hasExtracted,
  isAddressMismatch,
  previewUrl,
  onCaptureImage,
  onSimulateScan,
}: ScannerHeroProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await compressImageForOcr(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.82,
        mimeType: "image/jpeg",
      })
      if (!result.base64) {
        throw new Error("Imagem comprimida retornou vazia.")
      }
      console.log(
        `[Chegou.AI OCR] Imagem otimizada: ${result.originalSizeKb}KB -> ${result.compressedSizeKb}KB (${result.width}x${result.height})`
      )
      onCaptureImage(result.base64, result.mimeType)
    } catch {
      // Fallback seguro em caso de indisponibilidade de Canvas
      const mimeType = file.type || "image/jpeg"
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result
        if (typeof base64 === "string" && base64.trim().length > 0) {
          onCaptureImage(base64, mimeType)
        }
      }
      reader.readAsDataURL(file)
    } finally {
      // Limpar valor para permitir selecionar o mesmo arquivo novamente se desejar
      e.target.value = ""
    }
  }

  function handleOpenPicker() {
    if (!isScanning) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-zinc-300 bg-white p-6 sm:p-8 text-center transition-all hover:border-zinc-900 group shadow-2xs">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

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

      <div className="relative z-10 flex flex-col items-center gap-3.5 max-w-md w-full">
        {/* Preview image if available */}
        {previewUrl ? (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-zinc-200 shadow-xs mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Etiqueta Capturada"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleOpenPicker}
                className="bg-black/80 text-white rounded p-1.5 text-xs flex items-center gap-1"
              >
                <RefreshCw className="size-3" /> Trocar
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={handleOpenPicker}
            className={`size-14 rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform cursor-pointer ${
              isAddressMismatch ? "bg-red-950 text-white" : "bg-zinc-900 text-white"
            }`}
          >
            {isAddressMismatch ? (
              <AlertTriangle className="size-7 text-red-400 animate-in zoom-in-50" />
            ) : hasExtracted ? (
              <CheckCircle2 className="size-7 text-[#E1FF01] animate-in zoom-in-50" />
            ) : isScanning ? (
              <Sparkles className="size-7 text-[#E1FF01] animate-spin" />
            ) : (
              <Camera className="size-7 text-[#E1FF01]" />
            )}
          </div>
        )}

        <div className="space-y-1">
          <h4
            className={`font-extrabold text-base sm:text-lg ${
              isAddressMismatch ? "text-red-600" : "text-zinc-950"
            }`}
          >
            {isScanning
              ? "Gemini 2.5 Flash analisando etiqueta..."
              : isAddressMismatch
              ? "Endereço Divergente Identificado!"
              : hasExtracted
              ? "Etiqueta Lida com Sucesso!"
              : "Fotografar Etiqueta da Encomenda"}
          </h4>
          <p className="text-xs text-zinc-500">
            {isScanning
              ? "Processando foto em memória RAM via Google Gemini Vision (LGPD estrita: sem gravação em disco)."
              : isAddressMismatch
              ? "A IA identificou que o endereço da etiqueta não pertence a este condomínio. Os dados da encomenda não foram preenchidos."
              : hasExtracted
              ? "Dados extraídos pela IA. Revise o destinatário e a unidade abaixo antes de salvar."
              : "Aponte a câmera para a etiqueta ou envie uma foto. A IA extrairá destinatário, unidade e rastreio."}
          </p>
        </div>

        {!isScanning && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2 w-full">
            <button
              type="button"
              onClick={handleOpenPicker}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-black transition-colors"
            >
              <Camera className="size-4 text-[#E1FF01]" />
              <span>{hasExtracted ? "Tirar Outra Foto" : "Fotografar ou Enviar Imagem"}</span>
            </button>

            <button
              type="button"
              onClick={onSimulateScan}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-100 transition-colors"
            >
              <Sparkles className="size-3.5 text-zinc-500" />
              <span>Simular Extração</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
