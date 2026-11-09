"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Unit } from "@/entities/unit/model/types"
import { Resident } from "@/entities/resident/model/types"
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
  Building2,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  X,
  ArrowUpRight,
  FileSpreadsheet,
  UserPlus,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  LayoutGrid,
  ListFilter,
} from "lucide-react"
import { BatchImportDialog } from "@/features/batch-import/ui/batch-import-dialog"

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

interface UnitsManagerWidgetProps {
  initialUnits: Unit[]
  initialResidents?: Resident[]
  residentCounts?: Record<string, number>
}

function maskLgpdEmail(val: string): string {
  if (!val || !val.includes("@")) return val
  const [user, domain] = val.split("@")
  return `${user.slice(0, 2)}****@${domain}`
}

function formatPhoneInput(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ""
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export function UnitsManagerWidget({
  initialUnits,
  initialResidents = [],
}: UnitsManagerWidgetProps) {
  const [units, setUnits] = useState<Unit[]>(initialUnits || [])
  const [residents, setResidents] = useState<Resident[]>(initialResidents || [])
  const [search, setSearch] = useState("")
  const [filterBlock, setFilterBlock] = useState("ALL")
  const [viewMode, setViewMode] = useState<"BY_UNIT" | "ALL_RESIDENTS">("BY_UNIT")

  useEffect(() => {
    Promise.all([
      unitPort.listUnits().catch(() => []),
      unitPort.listAllResidents().catch(() => []),
    ]).then(([unitList, resList]) => {
      if (Array.isArray(unitList) && unitList.length > 0) setUnits(unitList)
      if (Array.isArray(resList) && resList.length > 0) setResidents(resList)
    })
  }, [])

  // Modais de Unidade
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [unitBlock, setUnitBlock] = useState("")
  const [unitNumber, setUnitNumber] = useState("")
  const [unitIsActive, setUnitIsActive] = useState(true)
  const [isUnitSubmitting, setIsUnitSubmitting] = useState(false)

  // Modais de Morador
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false)
  const [editingResident, setEditingResident] = useState<Resident | null>(null)
  const [residentFullName, setResidentFullName] = useState("")
  const [residentEmail, setResidentEmail] = useState("")
  const [residentPhone, setResidentPhone] = useState("")
  const [residentUnitId, setResidentUnitId] = useState("")
  const [residentDocLast4, setResidentDocLast4] = useState("")
  const [residentIsPrimary, setResidentIsPrimary] = useState(false)
  const [isResidentSubmitting, setIsResidentSubmitting] = useState(false)

  // Alert Dialog de Confirmação (shadcn)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    confirmLabel?: string
    isDestructive?: boolean
    onConfirm: () => void
  } | null>(null)

  // Batch import
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false)
  const [batchType, setBatchType] = useState<"UNITS" | "RESIDENTS">("UNITS")

  // Blocos únicos
  const blocks = Array.from(new Set(units.map((u) => u.block))).sort()

  // Agrupamento de moradores por unidade
  const residentsByUnit = useMemo(() => {
    const map: Record<string, Resident[]> = {}
    residents.forEach((r) => {
      if (!map[r.unitId]) map[r.unitId] = []
      map[r.unitId].push(r)
    })
    return map
  }, [residents])

  // Unidades filtradas
  const filteredUnits = units.filter((u) => {
    const matchesBlock = filterBlock === "ALL" || u.block === filterBlock
    const term = search.toLowerCase().trim()
    if (!term) return matchesBlock

    const unitMatches =
      u.block.toLowerCase().includes(term) ||
      u.number.toLowerCase().includes(term) ||
      `bloco ${u.block}`.toLowerCase().includes(term) ||
      `apto ${u.number}`.toLowerCase().includes(term)

    const unitResidents = residentsByUnit[u.id] || []
    const residentMatches = unitResidents.some(
      (r) =>
        r.fullName.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        (r.phone && r.phone.toLowerCase().includes(term))
    )

    return matchesBlock && (unitMatches || residentMatches)
  })

  // Moradores filtrados para visualização geral
  const filteredResidents = residents.filter((r) => {
    const unit = units.find((u) => u.id === r.unitId)
    const matchesBlock = filterBlock === "ALL" || (unit && unit.block === filterBlock)
    const term = search.toLowerCase().trim()
    if (!term) return matchesBlock

    const residentMatches =
      r.fullName.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      (r.phone && r.phone.toLowerCase().includes(term))

    const unitMatches =
      unit &&
      (unit.block.toLowerCase().includes(term) || unit.number.toLowerCase().includes(term))

    return matchesBlock && (residentMatches || unitMatches)
  })

  // Ações de Unidade
  function openCreateUnitModal() {
    setEditingUnit(null)
    setUnitBlock("")
    setUnitNumber("")
    setUnitIsActive(true)
    setIsUnitModalOpen(true)
  }

  function openEditUnitModal(unit: Unit) {
    setEditingUnit(unit)
    setUnitBlock(unit.block)
    setUnitNumber(unit.number)
    setUnitIsActive(unit.isActive)
    setIsUnitModalOpen(true)
  }

  async function handleUnitSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!unitBlock.trim() || !unitNumber.trim()) {
      toast.error("Preencha o Bloco e o Número da unidade")
      return
    }

    try {
      setIsUnitSubmitting(true)
      if (editingUnit) {
        const updated = await unitPort.updateUnit(editingUnit.id, {
          block: unitBlock.trim(),
          number: unitNumber.trim(),
          isActive: unitIsActive,
        })
        setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
        toast.success(`Unidade Bloco ${updated.block} - ${updated.number} atualizada!`)
      } else {
        const created = await unitPort.createUnit({
          block: unitBlock.trim(),
          number: unitNumber.trim(),
          isActive: unitIsActive,
        })
        setUnits((prev) => [...prev, created])
        toast.success(`Nova unidade Bloco ${created.block} - ${created.number} criada!`)
      }
      setUnitBlock("")
      setUnitNumber("")
      setEditingUnit(null)
      setIsUnitModalOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar unidade"
      toast.error(msg)
    } finally {
      setIsUnitSubmitting(false)
    }
  }

  function handleDeleteUnit(unit: Unit) {
    const linked = residentsByUnit[unit.id] || []
    setConfirmDialog({
      isOpen: true,
      title: linked.length > 0 ? "Excluir Unidade com Moradores?" : "Excluir Unidade?",
      description:
        linked.length > 0
          ? `A unidade Bloco ${unit.block} - ${unit.number} possui ${linked.length} morador(es) vinculado(s). Deseja realmente excluir esta unidade e seus vínculos?`
          : `Tem certeza que deseja excluir o Bloco ${unit.block} - ${unit.number}? Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir Unidade",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await unitPort.deleteUnit(unit.id)
          setUnits((prev) => prev.filter((u) => u.id !== unit.id))
          setResidents((prev) => prev.filter((r) => r.unitId !== unit.id))
          toast.success(`Unidade Bloco ${unit.block} - ${unit.number} removida!`)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Erro ao excluir unidade"
          toast.error(msg)
        }
      },
    })
  }

  // Ações de Morador
  function openCreateResidentModal(targetUnitId?: string) {
    setEditingResident(null)
    setResidentFullName("")
    setResidentEmail("")
    setResidentPhone("")
    setResidentUnitId(targetUnitId || units[0]?.id || "")
    setResidentDocLast4("")
    const currentResidents = targetUnitId ? residentsByUnit[targetUnitId] || [] : []
    setResidentIsPrimary(currentResidents.length === 0)
    setIsResidentModalOpen(true)
  }

  function openEditResidentModal(res: Resident) {
    setEditingResident(res)
    setResidentFullName(res.fullName)
    setResidentEmail(res.email)
    setResidentPhone(res.phone || "")
    setResidentUnitId(res.unitId)
    setResidentDocLast4(res.documentLast4 || "")
    setResidentIsPrimary(res.isPrimary)
    setIsResidentModalOpen(true)
  }

  async function handleResidentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!residentFullName.trim() || !residentEmail.trim() || !residentUnitId) {
      toast.error("Preencha Nome, E-mail e selecione a Unidade do morador")
      return
    }

    try {
      setIsResidentSubmitting(true)
      if (editingResident) {
        const updated = await unitPort.updateResident(editingResident.id, {
          fullName: residentFullName.trim(),
          email: residentEmail.trim(),
          phone: residentPhone.trim() || undefined,
          unitId: residentUnitId,
          documentLast4: residentDocLast4 || "0000",
          isPrimary: residentIsPrimary,
        })
        setResidents((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        toast.success(`Morador ${updated.fullName} atualizado com sucesso!`)
      } else {
        const created = await unitPort.createResident({
          fullName: residentFullName.trim(),
          email: residentEmail.trim(),
          phone: residentPhone.trim() || undefined,
          unitId: residentUnitId,
          documentLast4: residentDocLast4 || "0000",
          isPrimary: residentIsPrimary,
        })
        setResidents((prev) => [...prev, created])
        toast.success(`Morador ${created.fullName} vinculado com sucesso à unidade!`)
      }
      setIsResidentModalOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar morador"
      toast.error(msg)
    } finally {
      setIsResidentSubmitting(false)
    }
  }

  function handleDeleteResident(res: Resident) {
    setConfirmDialog({
      isOpen: true,
      title: "Desvincular e Remover Morador?",
      description: `Tem certeza que deseja desvincular e remover o morador ${res.fullName}? Ele não receberá mais notificações de encomendas vinculadas a esta unidade.`,
      confirmLabel: "Remover Morador",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await unitPort.deleteResident(res.id)
          setResidents((prev) => prev.filter((r) => r.id !== res.id))
          toast.success(`Morador ${res.fullName} removido com sucesso!`)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Erro ao remover morador"
          toast.error(msg)
        }
      },
    })
  }

  async function handleCopyInvite(res: Resident) {
    try {
      const invite = await unitPort.generateResidentInvite(res.id)
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const fullUrl = invite.inviteUrl.startsWith("http")
        ? invite.inviteUrl
        : `${origin}${invite.inviteUrl.startsWith("/") ? "" : "/"}${invite.inviteUrl}`

      await navigator.clipboard.writeText(fullUrl)
      toast.success("Link de ativação copiado para a área de transferência!", {
        description: fullUrl,
      })
    } catch {
      toast.error("Não foi possível gerar link de ativação")
    }
  }

  const activeUnitsCount = units.filter((u) => u.isActive).length
  const primaryCount = residents.filter((r) => r.isPrimary).length

  return (
    <div className="space-y-6">
      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Units */}
        <div className="relative rounded-2xl bg-[#18181B] text-white p-6 border border-zinc-800 shadow-md flex flex-col justify-between">
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
              Unidades Residenciais
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">
                {units.length}
              </span>
              <span className="text-xs text-zinc-400 font-medium">apartamentos</span>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 text-[#E1FF01] text-[11px] font-bold border border-zinc-700">
              {activeUnitsCount} Ativas
            </span>
            <span className="text-zinc-400 text-[11px]">{blocks.length} Blocos</span>
          </div>
        </div>

        {/* Card 2: Total Residents */}
        <div className="relative rounded-2xl bg-white text-zinc-900 p-6 border border-zinc-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="size-11 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center">
              <Users className="size-5 text-emerald-700" />
            </div>
            <span className="size-7 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Moradores Vinculados
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-950">
                {residents.length}
              </span>
              <span className="text-xs text-zinc-500 font-medium">pessoas cadastradas</span>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium text-[11px]">
              {primaryCount} Titulares • {residents.length - primaryCount} Dependentes
            </span>
            <span className="font-bold text-zinc-900">
              {(residents.length / (units.length || 1)).toFixed(1)} mor./apto
            </span>
          </div>
        </div>

        {/* Card 3: Quick Actions */}
        <div className="relative rounded-2xl bg-white text-zinc-900 p-6 border border-zinc-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="size-11 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <UserPlus className="size-5 text-zinc-700" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Gestão Centralizada
            </p>
            <h4 className="text-base font-bold text-zinc-950">Unidades & Moradores</h4>
            <p className="text-xs text-zinc-400">
              Cadastre apartamentos e vincule os condôminos diretamente.
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-zinc-100 flex items-center gap-2">
            <Button
              onClick={openCreateUnitModal}
              className="flex-1 rounded-full bg-zinc-900 hover:bg-black text-white font-semibold text-xs h-9 gap-1 shadow-xs"
            >
              <Plus className="size-3.5 text-[#E1FF01]" />
              <span>Nova Unidade</span>
            </Button>
            <Button
              onClick={() => openCreateResidentModal()}
              variant="outline"
              className="flex-1 rounded-full border-zinc-200 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 h-9 gap-1 shadow-2xs"
            >
              <UserPlus className="size-3.5 text-zinc-600" />
              <span>+ Morador</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setBatchType("UNITS")
                setIsBatchImportOpen(true)
              }}
              className="rounded-full border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 h-9 px-3 gap-1 shadow-2xs"
              title="Importação em lote CSV"
            >
              <FileSpreadsheet className="size-3.5 text-emerald-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search, Filter & View Mode Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 size-4 text-zinc-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por bloco, apartamento, morador, e-mail ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-xl border-zinc-200/90 bg-white pl-10 pr-4 text-xs sm:text-sm text-zinc-900 shadow-2xs placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Select value={filterBlock} onValueChange={(val) => setFilterBlock(val ?? "ALL")}>
              <SelectTrigger className="h-10 min-w-[160px] rounded-xl border border-zinc-200/90 bg-white px-3 text-xs font-bold text-zinc-700 shadow-2xs">
                <SelectValue placeholder="Todos os Blocos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL">Todos os Blocos</SelectItem>
                {blocks.map((b) => (
                  <SelectItem key={b} value={b}>
                    Bloco {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("BY_UNIT")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "BY_UNIT"
                ? "bg-white text-zinc-950 shadow-2xs"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <LayoutGrid className="size-3.5" />
            <span>Por Unidade</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("ALL_RESIDENTS")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "ALL_RESIDENTS"
                ? "bg-white text-zinc-950 shadow-2xs"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <ListFilter className="size-3.5" />
            <span>Todos os Moradores ({residents.length})</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Principal de Acordo com ViewMode */}
      {viewMode === "BY_UNIT" ? (
        /* Grid de Unidades com Moradores Vinculados */
        filteredUnits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center space-y-3">
            <Building2 className="size-10 text-zinc-300 mx-auto" />
            <h4 className="text-base font-bold text-zinc-900">Nenhuma unidade encontrada</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Não encontramos unidades correspondentes aos critérios de busca ou filtro.
            </p>
            <Button
              onClick={openCreateUnitModal}
              className="rounded-full bg-zinc-900 text-white text-xs h-9 px-4 font-bold"
            >
              Criar Unidade
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUnits.map((unit) => {
              const unitResidents = residentsByUnit[unit.id] || []

              return (
                <div
                  key={unit.id}
                  className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-2xs hover:border-zinc-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Cabeçalho da Unidade */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200">
                      <Building2 className="size-3.5 text-zinc-600" />
                      Bloco {unit.block}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {unit.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                          Inativa
                        </span>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditUnitModal(unit)}
                        className="rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 size-7"
                        title="Editar unidade"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteUnit(unit)}
                        className="rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 size-7"
                        title="Excluir unidade"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Número do Apartamento */}
                  <div>
                    <p className="text-[11px] uppercase font-semibold text-zinc-400">Apartamento</p>
                    <h3 className="text-2xl font-black text-zinc-950 tracking-tight">
                      {unit.number}
                    </h3>
                  </div>

                  {/* Lista de Moradores da Unidade */}
                  <div className="space-y-2.5 pt-3 border-t border-zinc-100 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                        <Users className="size-3.5 text-zinc-400" />
                        Moradores ({unitResidents.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => openCreateResidentModal(unit.id)}
                        className="text-[11px] font-bold text-zinc-900 hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="size-3 text-emerald-600" />
                        <span>Vincular</span>
                      </button>
                    </div>

                    {unitResidents.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-4 text-center space-y-2">
                        <p className="text-xs text-zinc-500 font-medium">
                          Nenhum morador vinculado
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openCreateResidentModal(unit.id)}
                          className="rounded-full text-xs font-bold border-zinc-300 hover:bg-white h-7 gap-1"
                        >
                          <UserPlus className="size-3 text-zinc-600" />
                          <span>Vincular Morador</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {unitResidents.map((res) => (
                          <div
                            key={res.id}
                            className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5 flex items-start justify-between gap-2 hover:bg-zinc-100/60 transition-colors"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-zinc-900 truncate">
                                  {res.fullName}
                                </span>
                                {res.isPrimary ? (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                    <ShieldCheck className="size-2.5" />
                                    Titular
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-medium text-zinc-500 bg-white px-1.5 py-0.2 rounded border border-zinc-200">
                                    Dep.
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-500 font-mono truncate">
                                {maskLgpdEmail(res.email)}
                              </p>
                              {res.phone && (
                                <p className="text-[10px] text-zinc-400 font-mono">
                                  {formatPhoneInput(res.phone)}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-0.5 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleCopyInvite(res)}
                                className="rounded-md text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 size-6 p-0"
                                title="Copiar link de ativação da conta"
                              >
                                <KeyRound className="size-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEditResidentModal(res)}
                                className="rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 size-6 p-0"
                                title="Editar morador"
                              >
                                <Edit2 className="size-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteResident(res)}
                                className="rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 size-6 p-0"
                                title="Desvincular morador"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Visão em Tabela de Todos os Moradores */
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-zinc-950">Lista Geral de Moradores</h3>
              <p className="text-xs text-zinc-500">
                Visualização consolidada com mascaramento LGPD e links rápidos de ativação
              </p>
            </div>
            <Button
              onClick={() => openCreateResidentModal()}
              className="rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold h-9 px-4 gap-1.5 shadow-xs"
            >
              <UserPlus className="size-3.5 text-[#E1FF01]" />
              <span>Cadastrar Morador</span>
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Morador</th>
                  <th className="py-3 px-4">Unidade</th>
                  <th className="py-3 px-4">Papel</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filteredResidents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400">
                      Nenhum morador encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredResidents.map((res) => {
                    const unit = units.find((u) => u.id === res.unitId)
                    return (
                      <tr key={res.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-zinc-900">{res.fullName}</div>
                          <div className="text-[11px] text-zinc-500 font-mono">
                            Doc: ***.***.{res.documentLast4 || "0000"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {unit ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200">
                              <Building2 className="size-3 text-zinc-500" />
                              Bl. {unit.block} • Apto {unit.number}
                            </span>
                          ) : (
                            <span className="text-zinc-400">Sem unidade</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {res.isPrimary ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <ShieldCheck className="size-3" />
                              Titular
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                              Dependente
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-600 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Mail className="size-3 text-zinc-400" />
                            <span>{maskLgpdEmail(res.email)}</span>
                          </div>
                          {res.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="size-3 text-zinc-400" />
                              <span>{formatPhoneInput(res.phone)}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyInvite(res)}
                              className="size-8 p-0 rounded-full text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50"
                              title="Copiar link de ativação da conta"
                            >
                              <KeyRound className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditResidentModal(res)}
                              className="size-8 p-0 rounded-full text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                              title="Editar morador"
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteResident(res)}
                              className="size-8 p-0 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50"
                              title="Remover morador"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Unidade */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-extrabold text-zinc-950">
                {editingUnit ? "Editar Unidade" : "Nova Unidade"}
              </h3>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsUnitModalOpen(false)}
                className="rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleUnitSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="block" className="text-xs font-bold text-zinc-700">
                    Bloco / Torre *
                  </Label>
                  <Input
                    id="block"
                    placeholder="Ex: A, B, Torre 1"
                    value={unitBlock}
                    onChange={(e) => setUnitBlock(e.target.value)}
                    className="h-10 rounded-xl border-zinc-200 uppercase"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="number" className="text-xs font-bold text-zinc-700">
                    Número do Apto *
                  </Label>
                  <Input
                    id="number"
                    placeholder="Ex: 101, 402"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="h-10 rounded-xl border-zinc-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={unitIsActive}
                  onChange={(e) => setUnitIsActive(e.target.checked)}
                  className="size-4 rounded text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                />
                <Label htmlFor="isActive" className="text-xs font-medium text-zinc-700 cursor-pointer">
                  Unidade ativa para recebimento de pacotes
                </Label>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="rounded-xl border-zinc-200 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isUnitSubmitting}
                  className="rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold text-xs px-5 shadow-xs"
                >
                  {isUnitSubmitting ? "Salvando..." : editingUnit ? "Atualizar" : "Criar Unidade"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Morador (Vincular à Unidade) */}
      {isResidentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-zinc-950">
                  {editingResident ? "Editar Morador" : "Vincular Novo Morador"}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Cadastre o morador para notificações automáticas de pacotes
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsResidentModalOpen(false)}
                className="rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleResidentSubmit} className="space-y-4">
              {/* Unidade */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Unidade (Apartamento) *</Label>
                <Select
                  value={residentUnitId}
                  onValueChange={(val) => val && setResidentUnitId(val)}
                >
                  <SelectTrigger className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-800">
                    <SelectValue placeholder="Selecione a Unidade">
                      {(val: unknown) => {
                        const selectedId = typeof val === "string" ? val : residentUnitId
                        const found = units.find((u) => u.id === selectedId)
                        return found ? `Bloco ${found.block} • Apartamento ${found.number}` : "Selecione a Unidade"
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-56">
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <span className="font-semibold text-zinc-900">
                          Bloco {u.block} • Apartamento {u.number}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nome Completo */}
              <div className="space-y-1.5">
                <Label htmlFor="resName" className="text-xs font-bold text-zinc-700">
                  Nome Completo *
                </Label>
                <Input
                  id="resName"
                  placeholder="Ex: Mariana Ferreira Santos"
                  value={residentFullName}
                  onChange={(e) => setResidentFullName(e.target.value)}
                  className="h-10 rounded-xl border-zinc-200"
                  required
                  autoFocus
                />
              </div>

              {/* E-mail */}
              <div className="space-y-1.5">
                <Label htmlFor="resEmail" className="text-xs font-bold text-zinc-700">
                  E-mail do Morador *
                </Label>
                <Input
                  id="resEmail"
                  type="email"
                  placeholder="mariana@email.com"
                  value={residentEmail}
                  onChange={(e) => setResidentEmail(e.target.value)}
                  className="h-10 rounded-xl border-zinc-200"
                  required
                />
              </div>

              {/* Telefone e Documento */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="resPhone" className="text-xs font-bold text-zinc-700">
                    WhatsApp / Telefone
                  </Label>
                  <Input
                    id="resPhone"
                    placeholder="(11) 99999-9999"
                    value={residentPhone}
                    onChange={(e) => setResidentPhone(formatPhoneInput(e.target.value))}
                    className="h-10 rounded-xl border-zinc-200 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="resDoc" className="text-xs font-bold text-zinc-700">
                    Últimos 4 Dígitos CPF
                  </Label>
                  <Input
                    id="resDoc"
                    placeholder="1234"
                    maxLength={4}
                    value={residentDocLast4}
                    onChange={(e) => setResidentDocLast4(e.target.value.replace(/\D/g, ""))}
                    className="h-10 rounded-xl border-zinc-200 font-mono text-center tracking-widest"
                  />
                </div>
              </div>

              {/* Titular */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={residentIsPrimary}
                  onChange={(e) => setResidentIsPrimary(e.target.checked)}
                  className="size-4 rounded text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                />
                <Label
                  htmlFor="isPrimary"
                  className="text-xs font-medium text-zinc-700 cursor-pointer"
                >
                  Definir como Morador Titular da Unidade
                </Label>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResidentModalOpen(false)}
                  className="rounded-xl border-zinc-200 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isResidentSubmitting}
                  className="rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold text-xs px-5 shadow-xs"
                >
                  {isResidentSubmitting
                    ? "Salvando..."
                    : editingResident
                    ? "Atualizar Morador"
                    : "Vincular Morador"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog de Importação em Lote */}
      <BatchImportDialog
        open={isBatchImportOpen}
        onOpenChange={setIsBatchImportOpen}
        type={batchType}
        onImportUnits={(items) => unitPort.importUnitsBatch(items)}
        onImportResidents={(items) => unitPort.importResidentsBatch(items)}
        onSuccess={() => {
          Promise.all([unitPort.listUnits(), unitPort.listAllResidents()]).then(
            ([unitList, resList]) => {
              if (Array.isArray(unitList)) setUnits(unitList)
              if (Array.isArray(resList)) setResidents(resList)
            }
          )
        }}
      />

      {/* Alert Dialog de Confirmação (shadcn) */}
      <AlertDialog
        open={!!confirmDialog?.isOpen}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null)
        }}
      >
        <AlertDialogContent className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-extrabold text-zinc-950">
              {confirmDialog?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-500">
              {confirmDialog?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3 border-t border-zinc-100 flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setConfirmDialog(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmDialog?.onConfirm()
                setConfirmDialog(null)
              }}
              className={
                confirmDialog?.isDestructive
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-zinc-900 hover:bg-black text-white"
              }
            >
              {confirmDialog?.confirmLabel || "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
