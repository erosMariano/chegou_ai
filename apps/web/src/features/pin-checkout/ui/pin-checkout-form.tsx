"use client"

import React, { useState, useEffect, useRef } from "react"
import { packagePort } from "@/shared/ports"
import { PackageItem } from "@/entities/package/model/types"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "sonner"
import { KeyRound, CheckCircle2, AlertTriangle, Delete, QrCode, Camera, RefreshCw } from "lucide-react"

export function PinCheckoutForm() {
  const [pin, setPin] = useState<string>("")
  const [qrTokenInput, setQrTokenInput] = useState<string>("")
  const [inputMode, setInputMode] = useState<"PIN" | "CAMERA" | "MANUAL_QR">("PIN")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deliveredPackage, setDeliveredPackage] = useState<PackageItem | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const html5QrCodeRef = useRef<any>(null)
  const isScanningRef = useRef(false)

  // Iniciar / Parar Câmera QR Code
  useEffect(() => {
    let isMounted = true

    async function startScanner() {
      if (inputMode !== "CAMERA" || deliveredPackage) return

      try {
        setCameraError(null)
        const { Html5Qrcode } = await import("html5-qrcode")
        if (!isMounted) return

        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode("qr-camera-stream")
        }

        const scanner = html5QrCodeRef.current

        if (!isScanningRef.current) {
          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
              aspectRatio: 1.0,
            },
            (decodedText: string) => {
              if (isScanningRef.current) {
                // Tenta vibrar o celular ao ler
                if (typeof navigator !== "undefined" && navigator.vibrate) {
                  navigator.vibrate([100, 50, 100])
                }
                stopScanner()
                submitCheckout(decodedText, "QR")
              }
            },
            () => {
              // Ignore frame read errors
            }
          )
          isScanningRef.current = true
          setIsCameraActive(true)
        }
      } catch (err: any) {
        console.warn("Erro ao acessar câmera para QR Code:", err)
        if (isMounted) {
          setIsCameraActive(false)
          setCameraError(
            "Não foi possível acessar a câmera do aparelho. Verifique as permissões de câmera do navegador ou utilize o modo PIN."
          )
        }
      }
    }

    async function stopScanner() {
      try {
        if (html5QrCodeRef.current && isScanningRef.current) {
          await html5QrCodeRef.current.stop()
          isScanningRef.current = false
          setIsCameraActive(false)
        }
      } catch (err) {
        // Ignora erros de parada
      }
    }

    if (inputMode === "CAMERA" && !deliveredPackage) {
      startScanner()
    } else {
      stopScanner()
    }

    return () => {
      isMounted = false
      stopScanner()
    }
  }, [inputMode, deliveredPackage])

  function handleKeypadPress(digit: string) {
    if (pin.length >= 6) return
    const nextPin = pin + digit
    setPin(nextPin)
    setErrorMessage(null)

    if (nextPin.length === 6) {
      submitCheckout(nextPin, "PIN")
    }
  }

  function handleBackspace() {
    setPin((prev) => prev.slice(0, -1))
    setErrorMessage(null)
  }

  function handleClear() {
    setPin("")
    setErrorMessage(null)
  }

  async function submitCheckout(token: string, method: "PIN" | "QR") {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const res = await packagePort.checkoutPackage({
        code: token,
        codeType: method,
      })

      if (res.success && res.packageItem) {
        setDeliveredPackage(res.packageItem)
        toast.success("Baixa confirmada com sucesso!", {
          description: `Encomenda entregue para ${res.packageItem.recipientNameRaw} (${res.packageItem.unit?.block}-${res.packageItem.unit?.number})`,
        })
      } else {
        const msg = res.message || "Código inválido ou encomenda já baixada"
        setErrorMessage(msg)
        toast.error(msg)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha na comunicação com a API"
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleReset() {
    setPin("")
    setQrTokenInput("")
    setDeliveredPackage(null)
    setErrorMessage(null)
    setCameraError(null)
  }

  return (
    <div className="rounded-lg border border-zinc-200/90 bg-white shadow-xs max-w-md mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <KeyRound className="size-5 text-[#E1FF01]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-zinc-950">Validar Retirada</h3>
            <p className="text-xs text-zinc-500">Baixa via PIN ou Câmera QR Code</p>
          </div>
        </div>

        {/* Toggle Mode */}
        <div className="flex bg-zinc-100 p-1 rounded-lg text-xs font-semibold gap-1 self-start sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setInputMode("PIN")
              handleReset()
            }}
            className={`px-2.5 py-1 rounded-lg transition-all h-7 ${
              inputMode === "PIN" ? "bg-white text-zinc-950 shadow-2xs font-bold" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            PIN
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setInputMode("CAMERA")
              handleReset()
            }}
            className={`px-2.5 py-1 rounded-lg transition-all h-7 flex items-center gap-1 ${
              inputMode === "CAMERA" ? "bg-white text-zinc-950 shadow-2xs font-bold" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Camera className="size-3.5" />
            Câmera QR
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setInputMode("MANUAL_QR")
              handleReset()
            }}
            className={`px-2.5 py-1 rounded-lg transition-all h-7 ${
              inputMode === "MANUAL_QR" ? "bg-white text-zinc-950 shadow-2xs font-bold" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Manual
          </Button>
        </div>
      </div>

      {deliveredPackage ? (
        /* Success State */
        <div className="p-6 rounded-lg bg-emerald-50/80 border border-emerald-200 text-center space-y-4 animate-in zoom-in-95">
          <div className="size-14 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm mx-auto">
            <CheckCircle2 className="size-8" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
              Entrega Confirmada
            </span>
            <h3 className="text-lg font-extrabold text-emerald-950 mt-1">
              {deliveredPackage.recipientNameRaw}
            </h3>
            <p className="text-xs text-emerald-800 font-semibold mt-0.5">
              Bloco {deliveredPackage.unit?.block} &bull; Apto {deliveredPackage.unit?.number}
            </p>
            <p className="text-[11px] text-emerald-700 font-mono mt-1">
              Rastreio: {deliveredPackage.trackingCode || "Local"}
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={handleReset}
              className="rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-5 h-9"
            >
              Nova Baixa
            </Button>
          </div>
        </div>
      ) : inputMode === "PIN" ? (
        /* Large Touch Keypad (>= 48px) */
        <div className="space-y-6">
          {/* PIN Digit Slots */}
          <div className="flex justify-center gap-2.5">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const char = pin[index]
              const isCurrent = pin.length === index
              return (
                <div
                  key={index}
                  className={`size-11 sm:size-12 rounded-lg flex items-center justify-center text-xl font-extrabold font-mono transition-all border ${
                    char
                      ? "bg-zinc-900 text-[#E1FF01] border-zinc-900 shadow-2xs scale-105"
                      : isCurrent
                      ? "border-zinc-900 bg-white ring-2 ring-zinc-900/10"
                      : "border-zinc-200 bg-zinc-50/80 text-zinc-400"
                  }`}
                >
                  {char || ""}
                </div>
              )
            })}
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs animate-in fade-in">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Numeric Keypad Grid */}
          <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleKeypadPress(num)}
                className="h-14 rounded-lg bg-zinc-50 hover:bg-zinc-100/90 active:bg-zinc-200 border border-zinc-200/80 text-xl font-bold text-zinc-900 transition-all select-none shadow-2xs cursor-pointer"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              disabled={isSubmitting || pin.length === 0}
              onClick={handleClear}
              className="h-14 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-500 border border-zinc-200/80 transition-all select-none cursor-pointer"
            >
              C
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleKeypadPress("0")}
              className="h-14 rounded-lg bg-zinc-50 hover:bg-zinc-100/90 active:bg-zinc-200 border border-zinc-200/80 text-xl font-bold text-zinc-900 transition-all select-none shadow-2xs cursor-pointer"
            >
              0
            </button>

            <button
              type="button"
              disabled={isSubmitting || pin.length === 0}
              onClick={handleBackspace}
              className="h-14 rounded-lg bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 border border-zinc-200/80 transition-all select-none cursor-pointer"
            >
              <Delete className="size-5" />
            </button>
          </div>

          <div className="text-center">
            <p className="text-[11px] text-zinc-400">
              Digite o PIN de 6 dígitos informado pelo morador.
            </p>
          </div>
        </div>
      ) : inputMode === "CAMERA" ? (
        /* Camera QR Scanner Mode */
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-lg bg-black aspect-square max-w-[280px] mx-auto border-2 border-zinc-900 shadow-md flex items-center justify-center">
            <div id="qr-camera-stream" className="w-full h-full [&_video]:object-cover" />

            {/* Target Reticle Overlay */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="size-48 border-2 border-[#E1FF01] rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] animate-pulse" />
              </div>
            )}

            {!isCameraActive && !cameraError && (
              <div className="text-center text-zinc-400 space-y-2 p-4">
                <RefreshCw className="size-6 animate-spin mx-auto text-[#E1FF01]" />
                <p className="text-xs">Iniciando câmera traseira...</p>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-center space-y-2">
              <p>{cameraError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputMode("PIN")}
                className="text-xs h-8"
              >
                Voltar para Teclado PIN
              </Button>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs font-semibold text-zinc-700">
              Aponte a câmera para o QR Code do passe do morador
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              A leitura e a baixa são realizadas automaticamente ao focar.
            </p>
          </div>
        </div>
      ) : (
        /* Manual QR Code Token Input Mode */
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Token UUID do QR Code</Label>
            <div className="relative">
              <QrCode className="absolute left-3.5 top-3 size-4 text-zinc-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Cole o token do QR Code"
                value={qrTokenInput}
                onChange={(e) => setQrTokenInput(e.target.value)}
                className="w-full h-10 rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-3 font-mono text-xs focus-visible:bg-white focus-visible:border-zinc-900"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Button
            type="button"
            disabled={isSubmitting || !qrTokenInput.trim()}
            onClick={() => submitCheckout(qrTokenInput, "QR")}
            className="w-full h-10 rounded-lg bg-zinc-900 hover:bg-black text-white font-semibold text-xs shadow-xs"
          >
            {isSubmitting ? "Validando Token..." : "Validar e Baixar"}
          </Button>
        </div>
      )}
    </div>
  )
}
