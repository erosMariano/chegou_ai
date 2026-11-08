"use client"

import React, { useState, useEffect } from "react"
import { Resident } from "@/entities/resident/model/types"
import { Unit } from "@/entities/unit/model/types"
import { unitPort } from "@/shared/ports"
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
import {
  Users,
  Plus,
  Search,
  Building2,
  Edit2,
  Trash2,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  X,
  Lock,
  ArrowUpRight,
} from "lucide-react"

interface ResidentsManagerWidgetProps {
  initialResidents: Resident[]
  units: Unit[]
}

function maskLgpdEmail(val: string): string {
  if (!val || !val.includes("@")) return val
  const [user, domain] = val.split("@")
  return `${user.slice(0, 2)}****@${domain}`
}

function maskLgpdPhone(val?: string): string {
  if (!val) return "Não cadastrado"
  const digits = val.replace(/\D/g, "")
  if (digits.length >= 10) {
    const ddd = digits.slice(0, 2)
    const first = digits.slice(2, 3)
    const last4 = digits.slice(-4)
    return `(${ddd}) ${first}****-${last4}`
  }
  return val
}

function formatPhoneInput(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ""
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export function ResidentsManagerWidget({
  initialResidents,
  units,
}: ResidentsManagerWidgetProps) {
  const [residents, setResidents] = useState<Resident[]>(initialResidents)
  const [search, setSearch] = useState("")
  const [filterUnit, setFilterUnit] = useState("ALL")

  useEffect(() => {
    unitPort.listAllResidents().then((items: Resident[]) => {
      if (Array.isArray(items) && items.length > 0) {
        setResidents(items)
      }
    }).catch(() => {})
  }, [])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingResident, setEditingResident] = useState<Resident | null>(null)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [unitId, setUnitId] = useState("")
  const [documentLast4, setDocumentLast4] = useState("")
  const [isPrimary, setIsPrimary] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const unitMap = new Map(units.map((u) => [u.id, u]))

  const filtered = residents.filter((r) => {
    const matchesUnit = filterUnit === "ALL" || r.unitId === filterUnit
    const term = search.toLowerCase()
    const unit = unitMap.get(r.unitId)
    const unitStr = unit ? `${unit.block} ${unit.number}`.toLowerCase() : ""
    const matchesSearch =
      !term ||
      r.fullName.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      (r.phone && r.phone.toLowerCase().includes(term)) ||
      unitStr.includes(term)

    return matchesUnit && matchesSearch
  })

  function openCreateModal() {
    setEditingResident(null)
    setFullName("")
    setEmail("")
    setPhone("")
    setUnitId(units[0]?.id || "")
    setDocumentLast4("")
    setIsPrimary(false)
    setIsModalOpen(true)
  }

  function openEditModal(res: Resident) {
    setEditingResident(res)
    setFullName(res.fullName)
    setEmail(res.email)
    setPhone(res.phone || "")
    setUnitId(res.unitId)
    setDocumentLast4(res.documentLast4 || "")
    setIsPrimary(res.isPrimary)
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !unitId) {
      toast.error("Preencha Nome, E-mail e selecione a Unidade")
      return
    }

    try {
      setIsSubmitting(true)
      if (editingResident) {
        const updated = await unitPort.updateResident(editingResident.id, {
          fullName,
          email,
          phone: phone.trim() || undefined,
          unitId,
          documentLast4: documentLast4 || "0000",
          isPrimary,
        })
        setResidents((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        toast.success(`Morador ${updated.fullName} atualizado!`)
      } else {
        const created = await unitPort.createResident({
          fullName,
          email,
          phone: phone.trim() || undefined,
          unitId,
          documentLast4: documentLast4 || "0000",
          isPrimary,
        })
        setResidents((prev) => [...prev, created])
        toast.success(`Morador ${created.fullName} cadastrado! Senha inicial: 123456`)
      }
      setIsModalOpen(false)
    } catch {
      toast.error("Erro ao salvar dados do morador")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(res: Resident) {
    if (confirm(`Tem certeza que deseja remover o morador ${res.fullName}?`)) {
      try {
        await unitPort.deleteResident(res.id)
        setResidents((prev) => prev.filter((r) => r.id !== res.id))
        toast.success(`Morador ${res.fullName} removido!`)
      } catch {
        toast.error("Erro ao remover morador")
      }
    }
  }

  const primaryCount = residents.filter((r) => r.isPrimary).length

  return (
    <div className="space-y-6">
      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Inverted Hero Card */}
        <div className="relative rounded-lg bg-[#18181B] text-white p-6 border border-zinc-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="size-11 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
              <Users className="size-5 text-[#E1FF01]" />
            </div>
            <span className="size-7 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-400">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Moradores Cadastrados
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">
                {residents.length}
              </span>
              <span className="text-xs text-zinc-400 font-medium">moradores</span>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-zinc-800 text-[#E1FF01] text-[11px] font-bold border border-zinc-700">
              {primaryCount} Titulares
            </span>
            <span className="text-zinc-400 text-[11px]">Conformidade LGPD</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative rounded-lg bg-white text-zinc-900 p-6 border border-zinc-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="size-11 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center">
              <Lock className="size-5 text-emerald-700" />
            </div>
            <span className="size-7 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Privacidade LGPD
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-950">
                100%
              </span>
              <span className="text-xs text-zinc-500 font-medium">dados mascarados</span>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium text-[11px]">Portaria restrita:</span>
            <span className="font-bold text-zinc-900">Apenas últimos 4 dígitos</span>
          </div>
        </div>

        {/* Card 3: Action */}
        <div className="relative rounded-lg bg-white text-zinc-900 p-6 border border-zinc-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="size-11 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <Building2 className="size-5 text-zinc-700" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Novo Cadastro
            </p>
            <h4 className="text-base font-bold text-zinc-950">Vincule condôminos</h4>
            <p className="text-xs text-zinc-400">Habilita recebimento de Web Push e passes</p>
          </div>
          <div className="pt-4 mt-2 border-t border-zinc-100">
            <Button
              onClick={openCreateModal}
              className="w-full rounded-lg bg-zinc-900 hover:bg-black text-white font-semibold text-xs h-9 gap-1.5 shadow-xs"
            >
              <Plus className="size-4 text-[#E1FF01]" />
              <span>Cadastrar Morador +</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 size-4 text-zinc-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por morador, e-mail, telefone ou apartamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border-zinc-200/90 bg-white pl-10 pr-4 text-xs sm:text-sm text-zinc-900 shadow-2xs placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Select value={filterUnit} onValueChange={(val) => setFilterUnit(val ?? "ALL")}>
            <SelectTrigger className="h-10 min-w-[200px] rounded-lg border border-zinc-200/90 bg-white px-3 text-xs font-bold text-zinc-700 shadow-2xs">
              <SelectValue placeholder="Todas as Unidades" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="ALL">Todas as Unidades</SelectItem>
              {units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  Bloco {u.block} - Apto {u.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Residents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((res) => {
          const unit = unitMap.get(res.unitId)
          return (
            <div
              key={res.id}
              className="rounded-lg border border-zinc-200/90 bg-white p-5 shadow-2xs hover:border-zinc-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200/90">
                  <Building2 className="size-3 text-zinc-500" />
                  {unit ? `Bl. ${unit.block} • Apto ${unit.number}` : "Sem unidade"}
                </span>

                <div className="flex items-center gap-1">
                  {res.isPrimary ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                      <ShieldCheck className="size-3" />
                      Titular
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200">
                      Dependente
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase font-semibold text-zinc-400">Morador</p>
                <h3 className="text-lg font-bold text-zinc-950 tracking-tight">
                  {res.fullName}
                </h3>
                <div className="space-y-0.5 mt-1.5">
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-mono">
                    <Mail className="size-3 text-zinc-400 shrink-0" />
                    <span>{maskLgpdEmail(res.email)}</span>
                  </p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-mono">
                    <Phone className="size-3 text-zinc-400 shrink-0" />
                    <span>{maskLgpdPhone(res.phone)}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-400">
                  Doc: <strong className="font-mono text-zinc-700">***.***.{res.documentLast4 || "0000"}</strong>
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditModal(res)}
                    className="rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                    title="Editar morador"
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(res)}
                    className="rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50"
                    title="Excluir morador"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-white border border-zinc-200 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-extrabold text-zinc-950">
                {editingResident ? "Editar Morador" : "Novo Morador"}
              </h3>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-bold text-zinc-700">
                  Nome Completo *
                </Label>
                <Input
                  id="fullName"
                  placeholder="Ex: Carlos Eduardo Silveira"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 rounded-lg border-zinc-200"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-zinc-700">
                    E-mail para Notificação *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ex: morador@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 rounded-lg border-zinc-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="phone" className="text-xs font-bold text-zinc-700">
                      Celular / WhatsApp
                    </Label>
                    <span className="text-[10px] text-zinc-400 font-medium">ADR-006</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Ex: (11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    className="h-10 rounded-lg border-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="unitId" className="text-xs font-bold text-zinc-700">
                    Unidade de Destino *
                  </Label>
                  <Select value={unitId} onValueChange={(val) => setUnitId(val ?? "")}>
                    <SelectTrigger className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 shadow-2xs">
                      <SelectValue placeholder="Selecione a unidade">
                        {(() => {
                          const u = units.find((item) => item.id === unitId)
                          return u ? `Bl. ${u.block} - Apto ${u.number}` : undefined
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          Bl. {u.block} - Apto {u.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="documentLast4" className="text-xs font-bold text-zinc-700">
                    Últimos 4 Dígitos Doc
                  </Label>
                  <Input
                    id="documentLast4"
                    maxLength={4}
                    placeholder="Ex: 4921"
                    value={documentLast4}
                    onChange={(e) => setDocumentLast4(e.target.value)}
                    className="h-10 rounded-lg border-zinc-200 font-mono text-center tracking-widest"
                  />
                </div>
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
                  Definir como Morador Titular da unidade
                </Label>
              </div>

              <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                  <Lock className="size-3.5 text-zinc-700" />
                  <span>Acesso ao Portal do Morador</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  O morador poderá acessar o portal com este e-mail e a senha inicial <strong>123456</strong>.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border-zinc-200 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-zinc-900 hover:bg-black text-white font-semibold text-xs px-5 shadow-xs"
                >
                  {isSubmitting ? "Salvando..." : editingResident ? "Atualizar" : "Salvar Morador"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
