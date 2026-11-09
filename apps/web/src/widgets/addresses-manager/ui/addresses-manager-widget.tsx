"use client"

import React, { useState, useEffect } from "react"
import { CondominiumAddress, CreateCondominiumAddressInput } from "@/entities/condominium/model/types"
import { condominiumPort } from "@/shared/ports"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "sonner"
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  X,
  Star,
  ShieldCheck,
  Building,
  AlertCircle,
  Search,
  Loader2,
  CheckCircle2,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/shared/ui/alert-dialog"

function formatCepInput(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
}

interface AddressesManagerWidgetProps {
  initialAddresses?: CondominiumAddress[]
}

export function AddressesManagerWidget({ initialAddresses = [] }: AddressesManagerWidgetProps) {
  const [addresses, setAddresses] = useState<CondominiumAddress[]>(initialAddresses)
  const [isLoading, setIsLoading] = useState(false)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CondominiumAddress | null>(null)
  const [label, setLabel] = useState("")
  const [street, setStreet] = useState("")
  const [number, setNumber] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("RJ")
  const [zipCode, setZipCode] = useState("")
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [isCepAutofilled, setIsCepAutofilled] = useState(false)
  // Desabilitado por default: apenas se o CEP der erro os campos serão habilitados para digitação manual
  const [isAddressFieldsDisabled, setIsAddressFieldsDisabled] = useState(true)
  const [aliasesRaw, setAliasesRaw] = useState("")
  const [isPrimary, setIsPrimary] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmAddressDialog, setConfirmAddressDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    confirmLabel?: string
    isDestructive?: boolean
    onConfirm: () => void
  } | null>(null)

  useEffect(() => {
    loadAddresses()
  }, [])

  async function loadAddresses() {
    try {
      setIsLoading(true)
      const data = await condominiumPort.listAddresses()
      if (Array.isArray(data) && data.length > 0) {
        setAddresses(data)
      }
    } catch {
      // Falha tratada silenciosamente
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchViaCep(rawCep: string) {
    const clean = rawCep.replace(/\D/g, "")
    if (clean.length !== 8) return

    try {
      setIsLoadingCep(true)
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      if (!res.ok) throw new Error("Falha ao consultar CEP")
      
      const data = await res.json()
      if (data.erro || data.erro === "true") {
        // CASO DÊ ERRO: HABILITA OS CAMPOS PARA DIGITAÇÃO MANUAL
        setIsAddressFieldsDisabled(false)
        setIsCepAutofilled(false)
        toast.warning("CEP não localizado na base dos Correios. Os campos foram liberados para preenchimento manual.")
        return
      }

      // Preenchimento com dados oficiais dos Correios (mantém desabilitado por padrão)
      setStreet(data.logradouro || "")
      setNeighborhood(data.bairro || "")
      setCity(data.localidade || "")
      setState(data.uf ? data.uf.toUpperCase() : "SP")
      setIsCepAutofilled(true)
      setIsAddressFieldsDisabled(true)
      toast.success("Endereço localizado com sucesso via ViaCEP!")

      // Foca automaticamente no campo de número
      setTimeout(() => {
        const numberInput = document.getElementById("address-number")
        if (numberInput) numberInput.focus()
      }, 100)
    } catch {
      // CASO DÊ ERRO (API fora ou rede): HABILITA OS CAMPOS PARA DIGITAÇÃO MANUAL
      setIsAddressFieldsDisabled(false)
      setIsCepAutofilled(false)
      toast.error("Não foi possível consultar a API do ViaCEP. Os campos foram liberados para preenchimento manual.")
    } finally {
      setIsLoadingCep(false)
    }
  }

  async function handleCepChange(value: string) {
    const formatted = formatCepInput(value)
    setZipCode(formatted)

    const clean = formatted.replace(/\D/g, "")
    if (clean.length === 8) {
      await fetchViaCep(clean)
    } else {
      setIsCepAutofilled(false)
      // Se apagar o CEP, mantém o comportamento padrão de campos desabilitados até buscar ou dar erro
      if (!editingAddress) {
        setIsAddressFieldsDisabled(true)
      }
    }
  }

  function resetFormAndClose() {
    setEditingAddress(null)
    setLabel("")
    setStreet("")
    setNumber("")
    setNeighborhood("")
    setCity("")
    setState("SP")
    setZipCode("")
    setIsCepAutofilled(false)
    setIsAddressFieldsDisabled(true) // Desabilitado por default!
    setIsLoadingCep(false)
    setAliasesRaw("")
    setIsPrimary(false)
    setIsModalOpen(false)
  }

  function openCreateModal() {
    setEditingAddress(null)
    setLabel("")
    setStreet("")
    setNumber("")
    setNeighborhood("")
    setCity("")
    setState("SP")
    setZipCode("")
    setIsCepAutofilled(false)
    setIsAddressFieldsDisabled(true) // Desabilitado por default!
    setIsLoadingCep(false)
    setAliasesRaw("")
    setIsPrimary(addresses.length === 0)
    setIsModalOpen(true)
  }

  function openEditModal(addr: CondominiumAddress) {
    setEditingAddress(addr)
    setLabel(addr.label)
    setStreet(addr.street)
    setNumber(addr.number)
    setNeighborhood(addr.neighborhood)
    setCity(addr.city)
    setState(addr.state)
    setZipCode(formatCepInput(addr.zipCode))
    setIsCepAutofilled(false)
    setIsAddressFieldsDisabled(false) // Ao editar endereço existente, campos habilitados
    setIsLoadingCep(false)
    setAliasesRaw((addr.addressAliases || []).join(", "))
    setIsPrimary(addr.isPrimary)
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !zipCode.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios do endereço")
      return
    }

    const aliases = aliasesRaw
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0)

    try {
      setIsSubmitting(true)
      const payload: CreateCondominiumAddressInput = {
        label: label.trim(),
        street: street.trim(),
        number: number.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.toUpperCase().trim(),
        zipCode: zipCode.replace(/\D/g, ""),
        addressAliases: aliases,
        isPrimary,
      }

      if (editingAddress) {
        const updated = await condominiumPort.updateAddress(editingAddress.id, payload)
        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === updated.id) return updated
            if (payload.isPrimary) return { ...a, isPrimary: false }
            return a
          })
        )
        toast.success(`Endereço "${updated.label}" atualizado com sucesso!`)
      } else {
        const created = await condominiumPort.createAddress(payload)
        setAddresses((prev) => {
          if (payload.isPrimary) {
            return [...prev.map((a) => ({ ...a, isPrimary: false })), created]
          }
          return [...prev, created]
        })
        toast.success(`Endereço "${created.label}" adicionado ao condomínio!`)
      }
      resetFormAndClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar endereço"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDelete(addr: CondominiumAddress) {
    if (addresses.length <= 1) {
      toast.error("O condomínio deve possuir no mínimo 1 endereço oficial cadastrado.")
      return
    }

    setConfirmAddressDialog({
      isOpen: true,
      title: "Remover Endereço Oficial?",
      description: `Tem certeza que deseja remover o endereço "${addr.label}"? A portaria e a IA de leitura de etiquetas não validarão mais correspondências direcionadas a esta entrada.`,
      confirmLabel: "Remover Endereço",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await condominiumPort.deleteAddress(addr.id)
          setAddresses((prev) => prev.filter((a) => a.id !== addr.id))
          toast.success(`Endereço "${addr.label}" removido com sucesso!`)
          loadAddresses()
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Erro ao remover endereço"
          toast.error(msg)
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Explanatório */}
      <div className="rounded-lg border border-zinc-200/90 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg bg-zinc-900 text-[#E1FF01] flex items-center justify-center shrink-0 shadow-2xs">
            <MapPin className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-zinc-950">
              Endereços Oficiais do Condomínio
            </h2>
            <p className="text-xs text-zinc-500 max-w-xl">
              Cadastre todas as portarias, entradas e esquinas oficiais aceitas. A inteligência artificial
              valida se as etiquetas de encomendas recebidas pertencem a um desses endereços cadastrados.
            </p>
          </div>
        </div>

        <Button
          onClick={openCreateModal}
          className="rounded-lg bg-zinc-900 hover:bg-black text-white font-semibold text-xs px-4 h-9 shrink-0 gap-1.5 shadow-xs"
        >
          <Plus className="size-3.5" />
          Adicionar Endereço
        </Button>
      </div>

      {/* Regra de Negócio: Mínimo 1 Endereço */}
      {addresses.length === 1 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center gap-2.5 text-xs text-amber-800">
          <AlertCircle className="size-4 text-amber-600 shrink-0" />
          <span>
            <strong>Regra de Integridade:</strong> O condomínio possui apenas 1 endereço cadastrado. Este endereço não pode ser excluído para garantir a validação contínua da portaria.
          </span>
        </div>
      )}

      {/* Grid de Endereços */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`rounded-lg border bg-white p-5 shadow-xs space-y-4 relative transition-all ${
              addr.isPrimary ? "border-zinc-900 ring-1 ring-zinc-900/10" : "border-zinc-200/90"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-zinc-950">{addr.label}</span>
                {addr.isPrimary && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-[#E1FF01]">
                    <Star className="size-3 fill-[#E1FF01]" />
                    Principal
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEditModal(addr)}
                  className="rounded-lg text-zinc-500 hover:text-zinc-900"
                  title="Editar endereço"
                >
                  <Edit2 className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={addresses.length <= 1}
                  onClick={() => handleDelete(addr)}
                  className="rounded-lg text-zinc-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-zinc-400 cursor-pointer"
                  title={addresses.length <= 1 ? "Mínimo 1 endereço obrigatório" : "Excluir endereço"}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="text-xs text-zinc-600 space-y-1 bg-zinc-50/70 p-3 rounded-lg border border-zinc-100">
              <p className="font-semibold text-zinc-900">
                {addr.street}, nº {addr.number}
              </p>
              <p>
                {addr.neighborhood} &bull; {addr.city} - {addr.state}
              </p>
              <p className="font-mono text-[11px] text-zinc-500">
                CEP: {addr.zipCode.replace(/^(\d{5})(\d{3})$/, "$1-$2") || addr.zipCode}
              </p>
            </div>

            {addr.addressAliases && addr.addressAliases.length > 0 && (
              <div className="pt-1">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-1.5">
                  Variações aceitas na etiqueta:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {addr.addressAliases.map((alias, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200 font-medium"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal / Dialog de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-lg bg-white border border-zinc-200 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-extrabold text-zinc-950">
                {editingAddress ? "Editar Endereço Oficial" : "Novo Endereço Oficial"}
              </h3>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={resetFormAndClose}
                className="rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. CEP em Primeiro Lugar com Busca Automática via ViaCEP */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="zipCode" className="text-xs font-bold text-zinc-700">
                    CEP (Busca Automática) *
                  </Label>
                  {isLoadingCep && (
                    <span className="text-[10px] font-semibold text-zinc-500 animate-pulse flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin text-zinc-800" />
                      Consultando ViaCEP...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="zipCode"
                    placeholder="00000-000"
                    maxLength={9}
                    value={zipCode}
                    onChange={(e) => handleCepChange(e.target.value)}
                    className="h-10 rounded-lg border-zinc-200 font-mono text-sm pr-9"
                    autoFocus={!editingAddress}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = zipCode.replace(/\D/g, "")
                      if (clean.length === 8) fetchViaCep(clean)
                      else toast.error("Informe os 8 dígitos do CEP para buscar")
                    }}
                    disabled={isLoadingCep}
                    className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-zinc-700 rounded-md transition-colors"
                    title="Buscar CEP na base dos Correios"
                  >
                    {isLoadingCep ? (
                      <Loader2 className="size-4 animate-spin text-zinc-700" />
                    ) : (
                      <Search className="size-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Digite o CEP: a rua, bairro, cidade e estado são preenchidos automaticamente.
                </p>
              </div>

              {/* Banner de Feedback do CEP e desbloqueio manual */}
              {isCepAutofilled && isAddressFieldsDisabled && (
                <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    Endereço preenchido via ViaCEP. Campos bloqueados por padrão.
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddressFieldsDisabled(false)}
                    className="font-bold underline text-emerald-900 hover:text-black shrink-0 ml-2"
                  >
                    Editar manualmente
                  </button>
                </div>
              )}

              {/* Banner quando campos foram liberados por falha/erro no CEP */}
              {!isAddressFieldsDisabled && !isCepAutofilled && (
                <div className="flex items-center gap-2 text-[11px] text-amber-800 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
                  <span>Campos liberados para preenchimento manual do endereço.</span>
                </div>
              )}

              {/* 2. Rótulo da Portaria / Entrada */}
              <div className="space-y-1.5">
                <Label htmlFor="label" className="text-xs font-bold text-zinc-700">
                  Rótulo / Identificação *
                </Label>
                <Input
                  id="label"
                  placeholder="Ex: Portaria Principal, Entrada Rua Lateral, Torre 2"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="h-10 rounded-lg border-zinc-200"
                />
              </div>

              {/* 3. Logradouro Oficial e Número */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="street" className="text-xs font-bold text-zinc-700">
                      Logradouro Oficial *
                    </Label>
                    {isAddressFieldsDisabled && (
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {isCepAutofilled ? "Preenchido via CEP" : "Bloqueado (aguardando CEP)"}
                      </span>
                    )}
                  </div>
                  <Input
                    id="street"
                    placeholder={isAddressFieldsDisabled ? "Preenchido automaticamente pelo CEP" : "Ex: Avenida das Américas"}
                    value={street}
                    disabled={isAddressFieldsDisabled}
                    onChange={(e) => setStreet(e.target.value)}
                    className="h-10 rounded-lg border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-600 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address-number" className="text-xs font-bold text-zinc-700">
                    Número *
                  </Label>
                  <Input
                    id="address-number"
                    placeholder="Ex: 1500"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="h-10 rounded-lg border-zinc-200"
                  />
                </div>
              </div>

              {/* 4. Bairro, Cidade e UF */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="neighborhood" className="text-xs font-bold text-zinc-700">
                    Bairro *
                  </Label>
                  <Input
                    id="neighborhood"
                    placeholder={isAddressFieldsDisabled ? "Preenchido pelo CEP" : "Ex: Barra da Tijuca"}
                    value={neighborhood}
                    disabled={isAddressFieldsDisabled}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="h-10 rounded-lg border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-600 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-bold text-zinc-700">
                    Cidade *
                  </Label>
                  <Input
                    id="city"
                    placeholder={isAddressFieldsDisabled ? "Preenchida pelo CEP" : "Ex: Rio de Janeiro"}
                    value={city}
                    disabled={isAddressFieldsDisabled}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-10 rounded-lg border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-600 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs font-bold text-zinc-700">
                    UF *
                  </Label>
                  <Input
                    id="state"
                    placeholder="UF"
                    maxLength={2}
                    value={state}
                    disabled={isAddressFieldsDisabled}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="h-10 rounded-lg border-zinc-200 uppercase disabled:bg-zinc-100 disabled:text-zinc-600 disabled:cursor-not-allowed text-center font-bold"
                  />
                </div>
              </div>

              {/* 5. Variações / Aliases para a IA */}
              <div className="space-y-1.5">
                <Label htmlFor="aliasesRaw" className="text-xs font-bold text-zinc-700">
                  Variações e Abreviações Aceitas (Separadas por vírgula)
                </Label>
                <Input
                  id="aliasesRaw"
                  placeholder="Ex: Av. das Américas, Av das Americas, Avenida Americas"
                  value={aliasesRaw}
                  onChange={(e) => setAliasesRaw(e.target.value)}
                  className="h-10 rounded-lg border-zinc-200 text-xs"
                />
                <p className="text-[11px] text-zinc-400">
                  A IA usará essas variações caso a etiqueta venha abreviada ou com nome alternativo.
                </p>
              </div>

              {/* 6. Endereço Principal */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="size-4 rounded text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                />
                <Label htmlFor="isPrimary" className="text-xs font-medium text-zinc-700 cursor-pointer">
                  Definir como Endereço Principal do condomínio
                </Label>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFormAndClose}
                  className="rounded-lg border-zinc-200 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-zinc-900 hover:bg-black text-white font-semibold text-xs px-5 shadow-xs"
                >
                  {isSubmitting ? "Salvando..." : editingAddress ? "Atualizar Endereço" : "Salvar Endereço"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Alert Dialog de Confirmação (shadcn) */}
      <AlertDialog
        open={!!confirmAddressDialog?.isOpen}
        onOpenChange={(open) => {
          if (!open) setConfirmAddressDialog(null)
        }}
      >
        <AlertDialogContent className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-extrabold text-zinc-950">
              {confirmAddressDialog?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-500">
              {confirmAddressDialog?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3 border-t border-zinc-100 flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setConfirmAddressDialog(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmAddressDialog?.onConfirm()
                setConfirmAddressDialog(null)
              }}
              className={
                confirmAddressDialog?.isDestructive
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-zinc-900 hover:bg-black text-white"
              }
            >
              {confirmAddressDialog?.confirmLabel || "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

