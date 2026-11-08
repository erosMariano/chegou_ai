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
} from "lucide-react"

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
  const [aliasesRaw, setAliasesRaw] = useState("")
  const [isPrimary, setIsPrimary] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  function resetFormAndClose() {
    setEditingAddress(null)
    setLabel("")
    setStreet("")
    setNumber("")
    setNeighborhood("")
    setCity("")
    setState("RJ")
    setZipCode("")
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
    setState("RJ")
    setZipCode("")
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
    setZipCode(addr.zipCode)
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

  async function handleDelete(addr: CondominiumAddress) {
    if (addresses.length <= 1) {
      toast.error("O condomínio deve possuir no mínimo 1 endereço oficial cadastrado.")
      return
    }

    if (confirm(`Tem certeza que deseja remover o endereço "${addr.label}"?`)) {
      try {
        await condominiumPort.deleteAddress(addr.id)
        setAddresses((prev) => prev.filter((a) => a.id !== addr.id))
        toast.success(`Endereço "${addr.label}" removido com sucesso!`)
        // Recarrega para atualizar primário caso necessário
        loadAddresses()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro ao remover endereço"
        toast.error(msg)
      }
    }
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
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="street" className="text-xs font-bold text-zinc-700">
                    Logradouro Oficial *
                  </Label>
                  <Input
                    id="street"
                    placeholder="Ex: Avenida das Américas"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="h-10 rounded-lg border-zinc-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="number" className="text-xs font-bold text-zinc-700">
                    Número *
                  </Label>
                  <Input
                    id="number"
                    placeholder="Ex: 1500"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="h-10 rounded-lg border-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="neighborhood" className="text-xs font-bold text-zinc-700">
                    Bairro *
                  </Label>
                  <Input
                    id="neighborhood"
                    placeholder="Ex: Barra da Tijuca"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="h-10 rounded-lg border-zinc-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-bold text-zinc-700">
                    Cidade *
                  </Label>
                  <Input
                    id="city"
                    placeholder="Ex: Rio de Janeiro"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-10 rounded-lg border-zinc-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs font-bold text-zinc-700">
                    UF *
                  </Label>
                  <Input
                    id="state"
                    placeholder="RJ"
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="h-10 rounded-lg border-zinc-200 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="zipCode" className="text-xs font-bold text-zinc-700">
                  CEP (Apenas dígitos) *
                </Label>
                <Input
                  id="zipCode"
                  placeholder="Ex: 22640101"
                  maxLength={9}
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="h-10 rounded-lg border-zinc-200 font-mono"
                />
              </div>

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
    </div>
  )
}

