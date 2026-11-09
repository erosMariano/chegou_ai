"use client"

import React, { useState, useEffect } from "react"
import { condominiumPort } from "@/shared/ports"
import { CondominiumProfile } from "@/entities/condominium/model/types"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "sonner"
import {
  Building2,
  Phone,
  FileText,
  MapPin,
  Save,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react"

function formatCnpjInput(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
}

function formatCepInput(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
}

function formatPhoneInput(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ""
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export function CondoSettingsWidget() {
  const [profile, setProfile] = useState<CondominiumProfile>({
    id: "",
    name: "",
    cnpj: "",
    conciergePhone: "",
    addressStreet: "",
    addressNumber: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const data = await condominiumPort.getProfile()
        if (data) {
          setProfile({
            id: data.id,
            name: data.name || "",
            cnpj: data.cnpj || "",
            conciergePhone: data.conciergePhone || "",
            addressStreet: data.addressStreet || "",
            addressNumber: data.addressNumber || "",
            neighborhood: data.neighborhood || "",
            city: data.city || "",
            state: data.state || "",
            zipCode: data.zipCode || "",
          })
        }
      } catch {
        toast.error("Erro ao carregar dados do condomínio")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile.name.trim()) {
      toast.error("O nome do condomínio é obrigatório.")
      return
    }

    try {
      setIsSaving(true)
      const updated = await condominiumPort.updateProfile({
        name: profile.name.trim(),
        cnpj: profile.cnpj?.trim() || null,
        conciergePhone: profile.conciergePhone?.trim() || null,
        addressStreet: profile.addressStreet?.trim() || null,
        addressNumber: profile.addressNumber?.trim() || null,
        neighborhood: profile.neighborhood?.trim() || null,
        city: profile.city?.trim() || null,
        state: profile.state?.trim() || null,
        zipCode: profile.zipCode?.trim() || null,
      })
      setProfile((prev) => ({ ...prev, ...updated }))
      toast.success("Configurações do condomínio salvas com sucesso!", {
        description: "Os dados foram atualizados e sincronizados com a IA.",
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar dados"
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 rounded-[24px] bg-zinc-200" />
        <div className="h-96 rounded-[24px] bg-zinc-100" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bento Grid Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Inverted Hero Card */}
        <div className="relative rounded-[24px] bg-[#18181B] text-white p-6 border border-zinc-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="size-11 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
              <Building2 className="size-5 text-[#E1FF01]" />
            </div>
            <span className="size-7 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-400">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Condomínio Ativo
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-white line-clamp-1">
                {profile.name || "Condomínio Residencial"}
              </span>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 text-[#E1FF01] text-[11px] font-bold border border-zinc-700">
              <CheckCircle2 className="size-3" />
              Sede Principal
            </span>
            <span className="text-zinc-400 text-[11px]">Sistema Chegou.AI</span>
          </div>
        </div>

        {/* Card 2: AI Address Guard */}
        <div className="relative rounded-[24px] bg-white text-zinc-900 p-6 border border-zinc-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="size-11 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center">
              <Sparkles className="size-5 text-indigo-700" />
            </div>
            <span className="size-7 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              IA & Validação de Etiquetas
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-zinc-950">
                Endereço Seguro
              </span>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium text-[11px]">Gemini Flash:</span>
            <span className="font-bold text-zinc-900">Bloqueio de mismatch</span>
          </div>
        </div>

        {/* Card 3: Portaria & Suporte */}
        <div className="relative rounded-[24px] bg-white text-zinc-900 p-6 border border-zinc-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="size-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Phone className="size-5 text-emerald-700" />
            </div>
            <span className="size-7 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Ramal Portaria
            </p>
            <h4 className="text-lg font-bold text-zinc-950 font-mono">
              {profile.conciergePhone || "Não configurado"}
            </h4>
            <p className="text-xs text-zinc-400">Exibido no portal do morador</p>
          </div>
          <div className="pt-4 mt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium text-[11px]">Canal direto</span>
            <span className="font-bold text-emerald-600">Disponível 24/7</span>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="rounded-[24px] border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="border-b border-zinc-100 pb-4">
          <h3 className="text-lg font-extrabold text-zinc-950 tracking-tight">
            Dados Oficiais do Condomínio
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Estas informações são utilizadas na geração de comprovantes, validação zero-shot de etiquetas pela IA e visualização no app dos condôminos.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Identificação Geral */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="condoName" className="text-xs font-bold text-zinc-700">
                Nome do Condomínio *
              </Label>
              <Input
                id="condoName"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Condomínio Residencial Parque Real"
                className="h-10 rounded-xl border-zinc-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cnpj" className="text-xs font-bold text-zinc-700">
                CNPJ do Condomínio
              </Label>
              <Input
                id="cnpj"
                value={profile.cnpj || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, cnpj: formatCnpjInput(e.target.value) }))
                }
                placeholder="00.000.000/0001-00"
                className="h-10 rounded-xl border-zinc-200 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="conciergePhone" className="text-xs font-bold text-zinc-700">
                Telefone / Ramal da Portaria
              </Label>
              <Input
                id="conciergePhone"
                value={profile.conciergePhone || ""}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    conciergePhone: formatPhoneInput(e.target.value),
                  }))
                }
                placeholder="(00) 00000-0000"
                className="h-10 rounded-xl border-zinc-200 font-mono"
              />
            </div>
          </div>

          {/* Endereço Físico */}
          <div className="pt-4 border-t border-zinc-100 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-zinc-600" />
              <h4 className="text-sm font-extrabold text-zinc-950">
                Endereço Físico para Cruzamento com Etiquetas (IA)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3 space-y-1.5">
                <Label htmlFor="street" className="text-xs font-bold text-zinc-700">
                  Logradouro (Rua, Avenida, Alameda)
                </Label>
                <Input
                  id="street"
                  value={profile.addressStreet || ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, addressStreet: e.target.value }))
                  }
                  placeholder="Ex: Avenida Paulista"
                  className="h-10 rounded-xl border-zinc-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="number" className="text-xs font-bold text-zinc-700">
                  Número
                </Label>
                <Input
                  id="number"
                  value={profile.addressNumber || ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, addressNumber: e.target.value }))
                  }
                  placeholder="1000"
                  className="h-10 rounded-xl border-zinc-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="neighborhood" className="text-xs font-bold text-zinc-700">
                  Bairro
                </Label>
                <Input
                  id="neighborhood"
                  value={profile.neighborhood || ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, neighborhood: e.target.value }))
                  }
                  placeholder="Ex: Bela Vista"
                  className="h-10 rounded-xl border-zinc-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-bold text-zinc-700">
                  Cidade
                </Label>
                <Input
                  id="city"
                  value={profile.city || ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, city: e.target.value }))
                  }
                  placeholder="São Paulo"
                  className="h-10 rounded-xl border-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs font-bold text-zinc-700">
                    UF
                  </Label>
                  <Input
                    id="state"
                    value={profile.state || ""}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))
                    }
                    placeholder="SP"
                    maxLength={2}
                    className="h-10 rounded-xl border-zinc-200 text-center font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="zipCode" className="text-xs font-bold text-zinc-700">
                    CEP
                  </Label>
                  <Input
                    id="zipCode"
                    value={profile.zipCode || ""}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, zipCode: formatCepInput(e.target.value) }))
                    }
                    placeholder="01311-000"
                    className="h-10 rounded-xl border-zinc-200 font-mono text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>Sincronização imediata com todos os porteiros logados</span>
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs h-10 px-6 gap-2 shadow-xs"
            >
              <Save className="size-4 text-[#E1FF01]" />
              <span>{isSaving ? "Salvando..." : "Salvar Configurações"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

