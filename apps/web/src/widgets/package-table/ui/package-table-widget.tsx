"use client"

import React, { useState } from "react"
import { PackageItem } from "@/entities/package/model/types"
import { PackageCard } from "@/entities/package/ui/package-card"
import { Input } from "@/shared/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui/select"
import { Clock, PackageCheck, Layers, Search, Filter, ArrowUpRight, Inbox } from "lucide-react"

interface PackageTableWidgetProps {
  initialPackages: PackageItem[]
}

export function PackageTableWidget({ initialPackages }: PackageTableWidgetProps) {
  const [packages] = useState<PackageItem[]>(initialPackages)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("ALL")

  const filtered = packages.filter((pkg) => {
    const matchesStatus = status === "ALL" || pkg.status === status
    const term = search.toLowerCase()
    const matchesSearch =
      !term ||
      pkg.recipientNameRaw.toLowerCase().includes(term) ||
      pkg.trackingCode.toLowerCase().includes(term) ||
      pkg.carrier.toLowerCase().includes(term) ||
      `${pkg.unit?.block}-${pkg.unit?.number}`.toLowerCase().includes(term)

    return matchesStatus && matchesSearch
  })

  const pendingCount = packages.filter(
    (p) => p.status === "RECEIVED" || p.status === "NOTIFIED"
  ).length
  const deliveredCount = packages.filter((p) => p.status === "DELIVERED").length

  return (
    <div className="space-y-6">
      {/* Bento Grid KPIs - Vault Style with Inverted Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Inverted Hero Card (#18181B) */}
        <div className="relative rounded-lg bg-[#18181B] text-white p-6 border border-zinc-800 shadow-md flex flex-col justify-between overflow-hidden group">
          <div className="flex items-center justify-between pb-3">
            <div className="size-11 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
              <Clock className="size-5 text-[#E1FF01]" />
            </div>
            <span className="size-7 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
              <ArrowUpRight className="size-4" />
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Aguardando Retirada
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">
                {pendingCount}
              </span>
              <span className="text-xs text-zinc-400 font-medium">pacotes na portaria</span>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-zinc-800 text-[#E1FF01] text-[11px] font-bold border border-zinc-700">
              <span className="size-1.5 rounded-full bg-[#E1FF01] animate-ping" />
              Prioridade Alta
            </span>
            <span className="text-zinc-400 text-[11px]">Sala de pacotes</span>
          </div>
        </div>

        {/* Card 2: Entregues Hoje */}
        <div className="relative rounded-lg bg-white text-zinc-900 p-6 border border-zinc-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="size-11 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center">
              <PackageCheck className="size-5 text-emerald-700" />
            </div>
            <span className="size-7 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
              <ArrowUpRight className="size-4" />
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Entregues com PIN/QR
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-950">
                {deliveredCount}
              </span>
              <span className="text-xs text-zinc-500 font-medium">baixas concluídas</span>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
              100% Auditável
            </span>
            <span className="text-zinc-400 text-[11px]">Zero extravios</span>
          </div>
        </div>

        {/* Card 3: Capacidade & Total */}
        <div className="relative rounded-lg bg-white text-zinc-900 p-6 border border-zinc-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="size-11 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <Layers className="size-5 text-zinc-700" />
            </div>
            <span className="size-7 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
              <ArrowUpRight className="size-4" />
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Volume da Portaria
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-950">
                {packages.length}
              </span>
              <span className="text-xs text-zinc-500 font-medium">registros no total</span>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-zinc-100 space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium text-zinc-500">
              <span>Capacidade da Sala</span>
              <span className="font-bold text-zinc-800">82% livre</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 rounded-lg overflow-hidden">
              <div className="bg-[#E1FF01] h-full rounded-lg w-[24%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Unified Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 size-4 text-zinc-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por morador, apto, rastreio ou transportadora..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border-zinc-200/90 bg-white pl-10 pr-4 text-xs sm:text-sm text-zinc-900 shadow-2xs placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Select value={status} onValueChange={(val) => setStatus(val ?? "ALL")}>
            <SelectTrigger className="h-10 min-w-[200px] rounded-lg border border-zinc-200/90 bg-white px-3 text-xs font-bold text-zinc-700 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <Filter className="size-3.5 text-zinc-500" />
                <SelectValue placeholder="Todos os Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="RECEIVED">Aguardando Retirada</SelectItem>
              <SelectItem value="NOTIFIED">Notificado</SelectItem>
              <SelectItem value="DELIVERED">Entregue</SelectItem>
              <SelectItem value="CANCELLED">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Package List Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-lg border border-zinc-200/90 p-8 space-y-3 shadow-2xs">
          <div className="size-12 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <Inbox className="size-6" />
          </div>
          <p className="text-sm font-bold text-zinc-800">Nenhuma encomenda encontrada</p>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Ajuste os termos de busca ou clique no botão Novo Check-in para registrar uma entrega.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((pkg) => (
            <PackageCard key={pkg.id} packageItem={pkg} />
          ))}
        </div>
      )}
    </div>
  )
}
