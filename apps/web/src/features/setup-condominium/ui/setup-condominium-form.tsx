"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  SetupCondominiumSchema,
  SetupCondominiumFormData,
} from "@/entities/condominium/model/schema"
import { useAuth } from "@/entities/user/ui/auth-provider"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Card, CardContent } from "@/shared/ui/card"
import { toast } from "sonner"
import {
  Building2,
  MapPin,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Search,
  Loader2,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react"

function formatCepInput(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
}

function formatCnpjInput(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export function SetupCondominiumForm() {
  const router = useRouter()
  const { setupInitialAdmin } = useAuth()

  const [step, setStep] = useState<1 | 2>(1)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [isCepAutofilled, setIsCepAutofilled] = useState(false)
  // Desabilitado por padrão: só habilita caso a busca na API ViaCEP falhe
  const [isAddressFieldsDisabled, setIsAddressFieldsDisabled] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<SetupCondominiumFormData>({
    resolver: zodResolver(SetupCondominiumSchema),
    defaultValues: {
      condominiumName: "",
      cnpj: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      zipCode: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      addressLabel: "Portaria Principal",
    },
  })

  const zipValue = watch("zipCode")
  const cnpjValue = watch("cnpj") || ""
  const streetValue = watch("street")
  const neighborhoodValue = watch("neighborhood")
  const cityValue = watch("city")
  const stateValue = watch("state")

  async function fetchViaCep(rawCep: string) {
    const clean = rawCep.replace(/\D/g, "")
    if (clean.length !== 8) return

    try {
      setIsLoadingCep(true)
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      if (!res.ok) throw new Error("Falha ao consultar CEP")

      const data = await res.json()
      if (data.erro || data.erro === "true") {
        setIsAddressFieldsDisabled(false)
        setIsCepAutofilled(false)
        toast.warning("CEP não encontrado nos Correios. Campos liberados para digitação manual.")
        return
      }

      setValue("street", data.logradouro || "", { shouldValidate: true })
      setValue("neighborhood", data.bairro || "", { shouldValidate: true })
      setValue("city", data.localidade || "", { shouldValidate: true })
      setValue("state", (data.uf || "").toUpperCase(), { shouldValidate: true })

      setIsCepAutofilled(true)
      // Se for CEP geral da cidade sem logradouro/bairro, libera para preenchimento; caso contrário mantém travado
      const missingDetails = !data.logradouro || !data.bairro
      setIsAddressFieldsDisabled(!missingDetails)
      toast.success("Endereço localizado via ViaCEP!")
    } catch {
      setIsAddressFieldsDisabled(false)
      setIsCepAutofilled(false)
      toast.error("Não foi possível consultar o ViaCEP. Os campos foram liberados manualmente.")
    } finally {
      setIsLoadingCep(false)
    }
  }

  function handleZipChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCepInput(e.target.value)
    setValue("zipCode", formatted, { shouldValidate: false })
    const clean = formatted.replace(/\D/g, "")
    if (clean.length === 8) {
      fetchViaCep(clean)
    } else if (isCepAutofilled) {
      setIsCepAutofilled(false)
    }
  }

  function handleCnpjChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCnpjInput(e.target.value)
    setValue("cnpj", formatted, { shouldValidate: false })
  }

  async function handleNextStep() {
    const step1Valid = await trigger([
      "condominiumName",
      "cnpj",
      "zipCode",
      "street",
      "number",
      "neighborhood",
      "city",
      "state",
    ])
    if (step1Valid) {
      setStep(2)
    }
  }

  async function onSubmit(data: SetupCondominiumFormData) {
    try {
      setIsSubmitting(true)
      await setupInitialAdmin({
        condominiumName: data.condominiumName,
        cnpj: data.cnpj || undefined,
        name: data.name,
        email: data.email,
        password: data.password,
        address: {
          label: data.addressLabel || "Portaria Principal",
          zipCode: data.zipCode.replace(/\D/g, ""),
          street: data.street,
          number: data.number,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state.toUpperCase(),
        },
      })

      toast.success("Condomínio criado com sucesso!", {
        description: "Agora você pode cadastrar blocos, apartamentos, moradores e porteiros.",
      })
      router.replace("/admin/unidades")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar condomínio."
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-3">
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
            step === 1
              ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {step > 1 ? <CheckCircle2 className="size-3.5" /> : <span>1</span>}
          <span>Condomínio & Endereço</span>
        </div>
        <div className="w-6 h-px bg-zinc-300" />
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
            step === 2
              ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
              : "bg-white text-zinc-400 border-zinc-200"
          }`}
        >
          <span>2</span>
          <span>Síndico / Admin</span>
        </div>
      </div>

      <Card className="rounded-2xl border border-zinc-200/90 bg-white shadow-xs overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className={step === 1 ? "space-y-5 animate-in fade-in-50 duration-200" : "hidden"}>
                {/* Bloco Condomínio */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <Building2 className="size-3.5 text-zinc-700" />
                    <span>Identificação do Condomínio</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="condominiumName" className="text-xs font-semibold text-zinc-700">
                      Nome do Condomínio *
                    </Label>
                    <Input
                      id="condominiumName"
                      placeholder="Ex: Grand Innova Condomínio Club"
                      {...register("condominiumName")}
                      className="h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm focus-visible:bg-white focus-visible:ring-zinc-900"
                    />
                    {errors.condominiumName && (
                      <p className="text-[11px] font-medium text-red-600">
                        {errors.condominiumName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cnpj" className="text-xs font-semibold text-zinc-700">
                      CNPJ <span className="text-zinc-400 font-normal">(opcional)</span>
                    </Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={cnpjValue}
                      onChange={handleCnpjChange}
                      className="h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm focus-visible:bg-white focus-visible:ring-zinc-900"
                    />
                    {errors.cnpj && (
                      <p className="text-[11px] font-medium text-red-600">{errors.cnpj.message}</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      <MapPin className="size-3.5 text-zinc-700" />
                      <span>Endereço Oficial (Validação IA)</span>
                    </div>
                    {isCepAutofilled && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        ViaCEP Ativo
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="zipCode" className="text-xs font-semibold text-zinc-700">
                        CEP *
                      </Label>
                      <div className="relative flex gap-2">
                        <Input
                          id="zipCode"
                          placeholder="00000-000"
                          value={zipValue}
                          onChange={handleZipChange}
                          maxLength={9}
                          className="h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm font-mono focus-visible:bg-white focus-visible:ring-zinc-900"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={isLoadingCep || zipValue.replace(/\D/g, "").length !== 8}
                          onClick={() => fetchViaCep(zipValue)}
                          className="h-10 w-10 shrink-0 rounded-lg border-zinc-200"
                          title="Buscar CEP"
                        >
                          {isLoadingCep ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Search className="size-4" />
                          )}
                        </Button>
                      </div>
                      {errors.zipCode && (
                        <p className="text-[11px] font-medium text-red-600">
                          {errors.zipCode.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="number" className="text-xs font-semibold text-zinc-700">
                        Número Predial *
                      </Label>
                      <Input
                        id="number"
                        placeholder="Ex: 1500"
                        {...register("number")}
                        className="h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm focus-visible:bg-white focus-visible:ring-zinc-900"
                      />
                      {errors.number && (
                        <p className="text-[11px] font-medium text-red-600">
                          {errors.number.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="street" className="text-xs font-semibold text-zinc-700">
                      Logradouro *
                    </Label>
                    <Input
                      id="street"
                      disabled={isAddressFieldsDisabled}
                      value={streetValue}
                      onChange={(e) => setValue("street", e.target.value, { shouldValidate: true })}
                      placeholder="Preenchido automaticamente pelo CEP"
                      className="h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm disabled:bg-zinc-100 disabled:text-zinc-600 disabled:cursor-not-allowed"
                    />
                    {errors.street && (
                      <p className="text-[11px] font-medium text-red-600">{errors.street.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5 space-y-1.5">
                      <Label htmlFor="neighborhood" className="text-xs font-semibold text-zinc-700">
                        Bairro *
                      </Label>
                      <Input
                        id="neighborhood"
                        disabled={isAddressFieldsDisabled}
                        value={neighborhoodValue}
                        onChange={(e) =>
                          setValue("neighborhood", e.target.value, { shouldValidate: true })
                        }
                        placeholder="Bairro"
                        className="h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm disabled:bg-zinc-100 disabled:text-zinc-600 disabled:cursor-not-allowed"
                      />
                      {errors.neighborhood && (
                        <p className="text-[11px] font-medium text-red-600">
                          {errors.neighborhood.message}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-5 space-y-1.5">
                      <Label htmlFor="city" className="text-xs font-semibold text-zinc-700">
                        Cidade *
                      </Label>
                      <Input
                        id="city"
                        disabled={isAddressFieldsDisabled}
                        value={cityValue}
                        onChange={(e) => setValue("city", e.target.value, { shouldValidate: true })}
                        placeholder="Cidade"
                        className="h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm disabled:bg-zinc-100 disabled:text-zinc-600 disabled:cursor-not-allowed"
                      />
                      {errors.city && (
                        <p className="text-[11px] font-medium text-red-600">
                          {errors.city.message}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <Label htmlFor="state" className="text-xs font-semibold text-zinc-700">
                        UF *
                      </Label>
                      <Input
                        id="state"
                        disabled={isAddressFieldsDisabled}
                        value={stateValue}
                        onChange={(e) =>
                          setValue("state", e.target.value.toUpperCase(), { shouldValidate: true })
                        }
                        placeholder="SP"
                        maxLength={2}
                        className="h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm uppercase disabled:bg-zinc-100 disabled:text-zinc-600 disabled:cursor-not-allowed"
                      />
                      {errors.state && (
                        <p className="text-[11px] font-medium text-red-600">
                          {errors.state.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-11 rounded-full bg-zinc-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-xs"
                >
                  <span>Avançar para Conta do Síndico</span>
                  <ArrowRight className="size-4 ml-2 text-[#E1FF01]" />
                </Button>
            </div>

            <div className={step === 2 ? "space-y-4 animate-in fade-in-50 duration-200" : "hidden"}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <UserCheck className="size-3.5 text-zinc-700" />
                  <span>Credenciais do Síndico / Administrador</span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-zinc-700">
                    Seu Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Eros Mariano"
                    {...register("name")}
                    className="h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm focus-visible:bg-white focus-visible:ring-zinc-900"
                  />
                  {errors.name && (
                    <p className="text-[11px] font-medium text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-zinc-700">
                    E-mail de Acesso *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 size-4 text-zinc-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="sindico@condominio.com.br"
                      {...register("email")}
                      className="pl-10 h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm focus-visible:bg-white focus-visible:ring-zinc-900"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] font-medium text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-zinc-700">
                      Senha (mín. 6 caracteres) *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 size-4 text-zinc-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••"
                        {...register("password")}
                        className="pl-10 h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm focus-visible:bg-white focus-visible:ring-zinc-900"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-[11px] font-medium text-red-600">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs font-semibold text-zinc-700">
                      Confirmar Senha *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 size-4 text-zinc-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••"
                        {...register("confirmPassword")}
                        className="pl-10 h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm focus-visible:bg-white focus-visible:ring-zinc-900"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] font-medium text-red-600">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-3 flex items-start gap-2.5 text-[11px] text-zinc-600">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Ao finalizar, este acesso tornará o condomínio ativo e fechará a tela pública de criação por segurança.
                  </span>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => setStep(1)}
                    className="h-11 rounded-full px-5 border-zinc-200 text-xs font-bold"
                  >
                    <ArrowLeft className="size-4 mr-1.5" />
                    Voltar
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-11 rounded-full bg-zinc-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Configurando Condomínio...
                      </>
                    ) : (
                      <>
                        <span>Criar Condomínio e Iniciar</span>
                        <ArrowRight className="size-4 ml-2 text-[#E1FF01]" />
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
