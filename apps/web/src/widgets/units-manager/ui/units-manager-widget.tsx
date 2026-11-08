"use client"

import React, { useState, useEffect } from "react"
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
  Building2,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  X,
  ArrowUpRight,
} from "lucide-react"

interface UnitsManagerWidgetProps {
  initialUnits: Unit[]
  residentCounts: Record<string, number>
}

export function UnitsManagerWidget({ initialUnits, residentCounts }: UnitsManagerWidgetProps) {
  const [units, setUnits] = useState<Unit[]>(initialUnits || [])
  const [search, setSearch] = useState("")
  const [filterBlock, setFilterBlock] = useState("ALL")

  useEffect(() => {
    unitPort
      .listUnits()
      .then((items: Unit[]) => {
        if (Array.isArray(items) && items.length > 0) {
          setUnits(items)
        }
      })
      .catch(() => {})
  }, [])

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [block, setBlock] = useState("")
  const [number, setNumber] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Unique blocks
  const blocks = Array.from(new Set(units.map((u) => u.block))).sort()

  const filtered = units.filter((u) => {
    const matchesBlock = filterBlock === "ALL" || u.block === filterBlock
    const term = search.toLowerCase()
    const matchesSearch =
      !term ||
      u.block.toLowerCase().includes(term) ||
      u.number.toLowerCase().includes(term)
    return matchesBlock && matchesSearch
  })

  function openCreateModal() {
    setEditingUnit(null)
    setBlock("")
    setNumber("")
    setIsActive(true)
    setIsModalOpen(true)
  }

  function resetFormAndClose() {
    setEditingUnit(null)
    setBlock("")
    setNumber("")
    setIsActive(true)
    setIsModalOpen(false)
  }

  function openEditModal(unit: Unit) {
    setEditingUnit(unit)
    setBlock(unit.block)
    setNumber(unit.number)
    setIsActive(unit.isActive)
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!block.trim() || !number.trim()) {
      toast.error("Preencha o Bloco e o Número da unidade")
      return
    }

    try {
      setIsSubmitting(true)
      if (editingUnit) {
        const updated = await unitPort.updateUnit(editingUnit.id, {
          block,
          number,
          isActive,
        })
        setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
        toast.success(`Unidade Bloco ${updated.block} - ${updated.number} atualizada!`)
      } else {
        const created = await unitPort.createUnit({
          block,
          number,
          isActive,
        })
        setUnits((prev) => [...prev, created])
        toast.success(`Nova unidade Bloco ${created.block} - ${created.number} criada!`)
      }
      resetFormAndClose()
    } catch {
      toast.error("Erro ao salvar unidade")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(unit: Unit) {
    if (confirm(`Tem certeza que deseja excluir o Bloco ${unit.block} - ${unit.number}?`)) {
      try {
        await unitPort.deleteUnit(unit.id)
        setUnits((prev) => prev.filter((u) => u.id !== unit.id))
        toast.success(`Unidade Bloco ${unit.block} - ${unit.number} removida!`)
      } catch {
        toast.error("Erro ao excluir unidade")
      }
    }
  }

  const activeUnitsCount = units.filter((u) => u.isActive).length
  const totalResidents = Object.values(residentCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Inverted Hero Card */}
        <div className="relative rounded-lg bg-[#18181B] text-white p-6 border border-zinc-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="size-11 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
              <Building2 className="size-5 text-[#E1FF01]" />
            </div>
            <span className="size-7 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-400">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Total de Unidades
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">
                {units.length}
              </span>
              <span className="text-xs text-zinc-400 font-medium">apartamentos</span>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-zinc-800 text-[#E1FF01] text-[11px] font-bold border border-zinc-700">
              {activeUnitsCount} Ativas
            </span>
            <span className="text-zinc-400 text-[11px]">{blocks.length} Blocos</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative rounded-lg bg-white text-zinc-900 p-6 border border-zinc-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="size-11 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center">
              <Users className="size-5 text-emerald-700" />
            </div>
            <span className="size-7 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Moradores Vinculados
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-950">
                {totalResidents}
              </span>
              <span className="text-xs text-zinc-500 font-medium">pessoas cadastradas</span>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium text-[11px]">Média por unidade:</span>
            <span className="font-bold text-zinc-900">
              {(totalResidents / (units.length || 1)).toFixed(1)} mor./apto
            </span>
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
              Nova Unidade
            </p>
            <h4 className="text-base font-bold text-zinc-950">Adicione blocos e aptos</h4>
            <p className="text-xs text-zinc-400">Cadastre para liberar o check-in de pacotes</p>
          </div>
          <div className="pt-4 mt-2 border-t border-zinc-100">
            <Button
              onClick={openCreateModal}
              className="w-full rounded-lg bg-zinc-900 hover:bg-black text-white font-semibold text-xs h-9 gap-1.5 shadow-xs"
            >
              <Plus className="size-4 text-[#E1FF01]" />
              <span>Cadastrar Unidade +</span>
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
            placeholder="Buscar por bloco ou número do apartamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border-zinc-200/90 bg-white pl-10 pr-4 text-xs sm:text-sm text-zinc-900 shadow-2xs placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Select value={filterBlock} onValueChange={(val) => setFilterBlock(val ?? "ALL")}>
            <SelectTrigger className="h-10 min-w-[180px] rounded-lg border border-zinc-200/90 bg-white px-3 text-xs font-bold text-zinc-700 shadow-2xs">
              <SelectValue placeholder="Todos os Blocos" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
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

      {/* Units Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((unit) => {
          const count = residentCounts[unit.id] || 0
          return (
            <div
              key={unit.id}
              className="rounded-lg border border-zinc-200/90 bg-white p-5 shadow-2xs hover:border-zinc-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200/90">
                  <Building2 className="size-3 text-zinc-500" />
                  Bloco {unit.block}
                </span>

                <div className="flex items-center gap-1">
                  {unit.isActive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/80">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Ativa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200">
                      Inativa
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase font-semibold text-zinc-400">Apartamento</p>
                <h3 className="text-2xl font-extrabold text-zinc-950 tracking-tight">
                  {unit.number}
                </h3>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-zinc-500">
                  <Users className="size-3.5 text-zinc-400" />
                  <strong className="text-zinc-800 font-bold">{count}</strong> morador(es)
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditModal(unit)}
                    className="rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                    title="Editar unidade"
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(unit)}
                    className="rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50"
                    title="Excluir unidade"
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
                {editingUnit ? "Editar Unidade" : "Nova Unidade"}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="block" className="text-xs font-bold text-zinc-700">
                    Bloco / Torre *
                  </Label>
                  <Input
                    id="block"
                    placeholder="Ex: A, B, Torre 1"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    className="h-10 rounded-lg border-zinc-200 uppercase"
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
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="h-10 rounded-lg border-zinc-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
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
                  {isSubmitting ? "Salvando..." : editingUnit ? "Atualizar" : "Criar Unidade"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
