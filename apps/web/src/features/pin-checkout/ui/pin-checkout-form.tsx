"use client"

import React, { useState } from "react"
import { packagePort } from "@/shared/ports"
import { PackageItem } from "@/entities/package/model/types"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { toast } from "sonner"
import { CheckCircle2, QrCode, KeyRound, AlertTriangle, ArrowRight, PackageCheck } from "lucide-react"

export function PinCheckoutForm() {
  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deliveredPackage, setDeliveredPackage] = useState<PackageItem | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) {
      toast.error("Informe o PIN de 6 dígitos ou Token do QR Code")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      const res = await packagePort.checkoutPackage({
        code: code.trim(),
        codeType: code.trim().length === 6 ? "PIN" : "QR",
      })

      setDeliveredPackage(res.packageItem)
      toast.success(res.message)
      setCode("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha na validação da retirada"
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleReset() {
    setDeliveredPackage(null)
    setErrorMessage(null)
    setCode("")
  }

  return (
    <Card className="border-slate-200 bg-white shadow-xs max-w-xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
            <KeyRound className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Validar Retirada (Check-out)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Digite o PIN numérico de 6 dígitos ou cole o Token do QR Code apresentado pelo morador
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {deliveredPackage ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-in zoom-in-95">
            <div className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm mx-auto">
              <CheckCircle2 className="size-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-950">
                Baixa Concluída com Sucesso!
              </h3>
              <p className="text-sm text-emerald-800 mt-1">
                Encomenda entregue para{" "}
                <span className="font-semibold">{deliveredPackage.recipientNameRaw}</span>
              </p>
              <p className="text-xs text-emerald-700">
                Unidade: Bloco {deliveredPackage.unit?.block} — Apto {deliveredPackage.unit?.number}{" "}
                &bull; Rastreio: {deliveredPackage.trackingCode}
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={handleReset}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs"
              >
                Nova Validação de Retirada
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="checkout-code" className="text-xs font-semibold text-slate-700">
                PIN de Retirada (6 dígitos) ou QR Token
              </Label>
              <div className="relative">
                <Input
                  id="checkout-code"
                  type="text"
                  placeholder="Ex: 482910"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  className="font-mono text-center text-xl tracking-widest h-12 uppercase border-slate-300 focus-visible:ring-indigo-600"
                  autoFocus
                />
                <div className="absolute right-3 top-3 text-slate-400">
                  <QrCode className="size-5" />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs animate-in fade-in">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Não foi possível dar baixa:</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || !code.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11"
              >
                {isSubmitting ? (
                  "Validando no banco..."
                ) : (
                  <>
                    <PackageCheck className="size-4 mr-1.5" />
                    Validar e Concluir Entrega
                  </>
                )}
              </Button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-500 space-y-1">
              <p className="font-medium text-slate-700 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-indigo-600" />
                Dica para teste rápido de demonstração:
              </p>
              <p>
                Use o PIN <code className="font-mono font-bold text-indigo-700">482910</code>{" "}
                (Mariana - Bloco B 402) ou{" "}
                <code className="font-mono font-bold text-indigo-700">194820</code> (Carlos - Bloco
                A 101).
              </p>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

