"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckinFormSchema, CheckinFormData } from "@/entities/package/model/schema"
import { packagePort, unitPort } from "@/shared/ports"
import { Unit } from "@/entities/unit/model/types"
import { ScannerHero } from "./scanner-hero"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { toast } from "sonner"
import { Sparkles, Check, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface ScanFormProps {
  units: Unit[]
}

export function ScanForm({ units }: ScanFormProps) {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiScore, setAiScore] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckinFormData>({
    resolver: zodResolver(CheckinFormSchema),
    defaultValues: {
      recipientNameRaw: "",
      unitId: "",
      carrier: "",
      trackingCode: "",
      aiConfidenceScore: null,
    },
  })

  const currentUnitId = watch("unitId")

  async function handleSimulateScan() {
    try {
      setIsScanning(true)
      const res = await packagePort.extractLabel("etiqueta-mock.jpg")
      setValue("recipientNameRaw", res.extracted.recipientName)
      setValue("carrier", res.extracted.carrier)
      setValue("trackingCode", res.extracted.trackingCode)
      setValue("aiConfidenceScore", res.confidenceScore)
      setAiScore(res.confidenceScore)

      if (res.matchedUnitId) {
        setValue("unitId", res.matchedUnitId)
      } else {
        const found = units.find(
          (u) =>
            u.block.toLowerCase() === res.extracted.unitBlock.toLowerCase() &&
            u.number === res.extracted.unitNumber
        )
        if (found) setValue("unitId", found.id)
      }

      toast.success("Etiqueta extraída com sucesso pelo Gemini 2.5 Flash!", {
        description: `Confiança: ${Math.round(res.confidenceScore * 100)}% em ${res.processingTimeMs}ms`,
      })
    } catch {
      toast.error("Erro ao simular extração por IA")
    } finally {
      setIsScanning(false)
    }
  }

  async function onSubmit(data: CheckinFormData) {
    try {
      setIsSubmitting(true)
      const idempotencyKey = crypto.randomUUID()
      const created = await packagePort.checkinPackage(data, idempotencyKey)

      toast.success("Encomenda registrada e notificação enviada!", {
        description: `PIN gerado: ${created.pickupPin} para ${created.recipientNameRaw} (${created.unit?.block}-${created.unit?.number})`,
      })

      router.push("/portaria")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao registrar encomenda"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <ScannerHero
        isScanning={isScanning}
        hasExtracted={aiScore !== null}
        onTriggerScan={handleSimulateScan}
      />

      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Dados da Encomenda
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Validação obrigatória de dados antes de persistir e despachar Web Push
              </CardDescription>
            </div>
            {aiScore !== null && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  aiScore >= 0.8
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {aiScore >= 0.8 ? (
                  <ShieldCheck className="size-3.5" />
                ) : (
                  <AlertCircle className="size-3.5" />
                )}
                Confiança IA: {Math.round(aiScore * 100)}%
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="recipientNameRaw" className="text-xs font-semibold text-slate-700">
                  Nome do Destinatário *
                </Label>
                <Input
                  id="recipientNameRaw"
                  placeholder="Ex: Mariana Costa Silva"
                  {...register("recipientNameRaw")}
                  className={errors.recipientNameRaw ? "border-red-400" : ""}
                />
                {errors.recipientNameRaw && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {errors.recipientNameRaw.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unitId" className="text-xs font-semibold text-slate-700">
                  Unidade de Destino (Bloco / Apto) *
                </Label>
                <select
                  id="unitId"
                  value={currentUnitId || ""}
                  onChange={(e) => setValue("unitId", e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                >
                  <option value="">Selecione o Bloco e Apartamento</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      Bloco {u.block} — Apartamento {u.number}
                    </option>
                  ))}
                </select>
                {errors.unitId && (
                  <p className="text-[11px] text-red-600 font-medium">{errors.unitId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="carrier" className="text-xs font-semibold text-slate-700">
                  Transportadora
                </Label>
                <Input
                  id="carrier"
                  placeholder="Ex: Mercado Livre, Amazon, Shopee, Correios"
                  {...register("carrier")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="trackingCode" className="text-xs font-semibold text-slate-700">
                  Código de Rastreio
                </Label>
                <Input
                  id="trackingCode"
                  placeholder="Ex: BR26984120984ML"
                  {...register("trackingCode")}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles className="size-3 text-indigo-500" />
                LGPD: Imagens nunca são salvas em disco.
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/portaria")}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {isSubmitting ? (
                    "Registrando..."
                  ) : (
                    <>
                      Confirmar Check-in
                      <ArrowRight className="size-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

