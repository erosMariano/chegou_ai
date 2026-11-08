"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckinFormSchema, CheckinFormData } from "@/entities/package/model/schema"
import { packagePort, unitPort } from "@/shared/ports"
import { Unit } from "@/entities/unit/model/types"
import { AddressValidation } from "@/entities/package/model/types"
import { ScannerHero } from "./scanner-hero"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui/select"
import { toast } from "sonner"
import { Sparkles, ArrowRight, ShieldCheck, AlertCircle, Building2, Check, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { generateUUID } from "@/shared/lib/utils"

interface ScanFormProps {
  units: Unit[]
}

export function ScanForm({ units }: ScanFormProps) {
  const router = useRouter()
  const [unitsList, setUnitsList] = useState<Unit[]>(units || [])
  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiScore, setAiScore] = useState<number | null>(null)
  const [addressValidation, setAddressValidation] = useState<AddressValidation | null>(null)
  const [activeStep, setActiveStep] = useState<1 | 2>(1)

  useEffect(() => {
    let isMounted = true
    unitPort
      .listUnits()
      .then((loaded) => {
        if (isMounted && Array.isArray(loaded) && loaded.length > 0) {
          setUnitsList(loaded)
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
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
  const recipientName = watch("recipientNameRaw")
  const selectedUnit = unitsList.find((u) => u.id === currentUnitId)

  async function processExtraction(base64Image?: string, mimeType?: string) {
    try {
      setIsScanning(true)
      const res = await packagePort.extractLabel(base64Image, mimeType)

      if (res.extracted.recipientName) {
        setValue("recipientNameRaw", res.extracted.recipientName, { shouldValidate: true })
      }
      if (res.extracted.carrier) {
        setValue("carrier", res.extracted.carrier, { shouldValidate: true })
      }
      if (res.extracted.trackingCode) {
        setValue("trackingCode", res.extracted.trackingCode, { shouldValidate: true })
      }

      setValue("aiConfidenceScore", res.confidenceScore)
      setAiScore(res.confidenceScore)

      if (res.addressValidation) {
        setAddressValidation(res.addressValidation)
      }

      if (res.matchedUnitId) {
        setValue("unitId", res.matchedUnitId, { shouldValidate: true })
      } else if (res.extracted.unitNumber) {
        const targetBlock = (res.extracted.unitBlock || "").toUpperCase().replace(/BLOCO|TORRE/gi, "").trim()
        const targetNumber = res.extracted.unitNumber.trim()
        const found = unitsList.find((u) => {
          const uBlock = u.block.toUpperCase().replace(/BLOCO|TORRE/gi, "").trim()
          return u.number === targetNumber && (!targetBlock || uBlock === targetBlock || uBlock === "UNICO")
        })
        if (found) {
          setValue("unitId", found.id, { shouldValidate: true })
        }
      }

      const scorePct = Math.round(res.confidenceScore * 100)
      if (res.confidenceScore >= 0.8) {
        toast.success("Etiqueta analisada com sucesso via Gemini 2.5 Flash!", {
          description: `Confiança: ${scorePct}% em ${res.processingTimeMs}ms`,
        })
      } else {
        toast.warning("Atenção: Confiança da leitura abaixo de 80%", {
          description: `A IA identificou ${scorePct}%. Por favor revise o destinatário e a unidade abaixo.`,
        })
      }
      setActiveStep(2)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao processar extração por IA"
      toast.error(msg)
    } finally {
      setIsScanning(false)
    }
  }

  function handleCaptureImage(base64Image: string, mimeType: string) {
    setPreviewUrl(base64Image)
    processExtraction(base64Image, mimeType)
  }

  function handleSimulateScan() {
    setPreviewUrl(null)
    processExtraction()
  }

  async function onSubmit(data: CheckinFormData) {
    try {
      setIsSubmitting(true)
      const idempotencyKey = generateUUID()
      const created = await packagePort.checkinPackage(data, idempotencyKey)

      toast.success("Check-in concluído e Web Push despachado!", {
        description: `Notificação enviada para ${created.recipientNameRaw} (${created.unit?.block}-${created.unit?.number})`,
      })

      // Limpa todos os campos do formulário e estados de imagem/IA
      reset({
        recipientNameRaw: "",
        unitId: "",
        carrier: "",
        trackingCode: "",
        aiConfidenceScore: null,
      })
      setPreviewUrl(null)
      setAiScore(null)
      setAddressValidation(null)
      setActiveStep(1)

      router.push("/portaria")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao registrar encomenda"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Visual Stepper */}
      <div className="flex items-center justify-between px-2 pb-2 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <span
            className={`size-6 rounded-lg flex items-center justify-center text-xs font-bold ${
              activeStep >= 1
                ? "bg-zinc-900 text-[#E1FF01]"
                : "bg-zinc-200 text-zinc-500"
            }`}
          >
            1
          </span>
          <span className="text-xs font-semibold text-zinc-800">Foto &amp; IA</span>
        </div>

        <div className="h-0.5 flex-1 mx-4 bg-zinc-200 rounded-lg overflow-hidden">
          <div
            className={`h-full bg-zinc-900 transition-all duration-300 ${
              activeStep === 2 ? "w-full" : "w-1/2"
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`size-6 rounded-lg flex items-center justify-center text-xs font-bold ${
              activeStep === 2
                ? "bg-zinc-900 text-[#E1FF01]"
                : "bg-zinc-200 text-zinc-500"
            }`}
          >
            2
          </span>
          <span className="text-xs font-semibold text-zinc-800">Revisão &amp; Destino</span>
        </div>
      </div>

      {/* Camera Dropzone Hero */}
      <ScannerHero
        isScanning={isScanning}
        hasExtracted={aiScore !== null}
        previewUrl={previewUrl}
        onCaptureImage={handleCaptureImage}
        onSimulateScan={handleSimulateScan}
      />

      {/* Editable Verification Card */}
      <div className="rounded-lg border border-zinc-200/90 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-base font-bold text-zinc-950">Dados da Encomenda</h3>
            <p className="text-xs text-zinc-500">
              Revise o destinatário e a unidade antes de gerar o PIN de retirada
            </p>
          </div>

          {aiScore !== null && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                aiScore >= 0.8
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {aiScore >= 0.8 ? (
                <ShieldCheck className="size-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="size-3.5 text-amber-600" />
              )}
              IA: {Math.round(aiScore * 100)}%
            </div>
          )}
        </div>

        {/* Address Validation Feedback */}
        {addressValidation && (
          <div className="pt-1">
            {addressValidation.isMatch === true && (
              <div className="rounded-lg bg-emerald-50/90 border border-emerald-200/90 p-3.5 flex items-start gap-3 text-xs text-emerald-950 animate-in fade-in">
                <div className="size-7 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                    Endereço Oficial Validado
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                      {addressValidation.matchedAddressLabel || "Portaria Principal"}
                    </span>
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    A IA confirmou que a etiqueta corresponde a um dos endereços oficiais cadastrados deste condomínio.
                  </p>
                </div>
              </div>
            )}

            {addressValidation.isMatch === false && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 flex items-start gap-3 text-xs text-red-950 animate-in fade-in">
                <div className="size-7 rounded-md bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="size-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-red-950 uppercase tracking-wide text-[10px] bg-red-200/90 text-red-900 px-2 py-0.5 rounded">
                      Alerta de Divergência
                    </span>
                    <p className="font-bold text-red-900">Endereço Não Pertence a Este Condomínio!</p>
                  </div>
                  <p className="text-[11px] text-red-800 leading-relaxed">
                    {addressValidation.mismatchReason || "Os dados da etiqueta indicam outro logradouro/número."}
                  </p>
                  <p className="text-[10px] font-semibold text-red-600">
                    Por favor, confira com o entregador antes de confirmar o recebimento do pacote.
                  </p>
                </div>
              </div>
            )}

            {addressValidation.isMatch === null && (
              <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-2.5 flex items-center gap-2 text-xs text-zinc-600">
                <Building2 className="size-3.5 text-zinc-400 shrink-0" />
                <span>Logradouro não identificado com clareza na etiqueta.</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Destinatário */}
          <div className="space-y-1.5">
            <Label htmlFor="recipientNameRaw" className="text-xs font-bold text-zinc-700">
              Nome do Destinatário *
            </Label>
            <Input
              id="recipientNameRaw"
              placeholder="Ex: Mariana Costa Silva"
              {...register("recipientNameRaw")}
              className={`h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm focus-visible:bg-white focus-visible:ring-zinc-900 ${
                errors.recipientNameRaw ? "border-red-400" : ""
              }`}
            />
            {errors.recipientNameRaw && (
              <p className="text-[11px] text-red-600 font-medium">
                {errors.recipientNameRaw.message}
              </p>
            )}
          </div>

          {/* Unidade de Destino */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <Building2 className="size-3.5 text-zinc-500" />
                Unidade de Destino *
              </Label>
              <span className="text-[11px] text-zinc-400 font-medium">
                Selecione na lista ou use os atalhos
              </span>
            </div>

            <Select
              value={currentUnitId || ""}
              onValueChange={(val) => setValue("unitId", val || "", { shouldValidate: true })}
            >
              <SelectTrigger className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 shadow-2xs">
                <SelectValue placeholder="Selecione a unidade correspondente...">
                  {selectedUnit ? `Bloco ${selectedUnit.block} - Apto ${selectedUnit.number}` : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {unitsList.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    Bloco {u.block} - Apto {u.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Quick chips for most frequent units */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {unitsList.slice(0, 6).map((u) => {
                const isSelected = currentUnitId === u.id
                return (
                  <Button
                    key={u.id}
                    type="button"
                    variant="outline"
                    onClick={() => setValue("unitId", u.id, { shouldValidate: true })}
                    className={`flex items-center justify-between p-2.5 h-auto rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs hover:bg-black hover:text-white"
                        : "bg-zinc-50/60 border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    <span>
                      Bl. {u.block} • Apto {u.number}
                    </span>
                    {isSelected && <Check className="size-3.5 text-[#E1FF01]" />}
                  </Button>
                )
              })}
            </div>

            {errors.unitId && (
              <p className="text-[11px] text-red-600 font-medium">{errors.unitId.message}</p>
            )}
          </div>

          {/* Grid de Transportadora e Rastreio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="carrier" className="text-xs font-bold text-zinc-700">
                Transportadora
              </Label>
              <Input
                id="carrier"
                placeholder="Ex: Mercado Livre, Amazon, Shopee"
                {...register("carrier")}
                className="h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm focus-visible:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trackingCode" className="text-xs font-bold text-zinc-700">
                Código de Rastreio
              </Label>
              <Input
                id="trackingCode"
                placeholder="Ex: BR26984120984ML"
                {...register("trackingCode")}
                className="h-10 rounded-lg border-zinc-200 bg-zinc-50/50 font-mono text-sm focus-visible:bg-white"
              />
            </div>
          </div>

          {/* Actions Footer */}
          <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="size-3 text-zinc-400" />
              Notificação Push disparada ao salvar
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/portaria")}
                disabled={isSubmitting}
                className="rounded-lg border-zinc-200 text-xs flex-1 sm:flex-initial"
              >
                <ArrowLeft className="size-3.5 mr-1" />
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || !recipientName?.trim() || !currentUnitId}
                className="rounded-lg bg-zinc-900 hover:bg-black text-white font-semibold text-xs h-10 px-5 flex-1 sm:flex-initial shadow-xs"
              >
                {isSubmitting ? (
                  "Registrando..."
                ) : (
                  <>
                    Confirmar Check-in
                    <ArrowRight className="size-3.5 ml-1 text-[#E1FF01]" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
