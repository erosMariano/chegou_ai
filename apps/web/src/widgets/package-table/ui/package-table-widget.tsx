"use client"

import React, { useState } from "react"
import { PackageItem } from "@/entities/package/model/types"
import { PackageCard } from "@/entities/package/ui/package-card"
import { AuditFilterBar } from "@/features/audit-filter/ui/audit-filter-bar"
import { Inbox, PackageCheck, Clock, Layers } from "lucide-react"

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
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Aguardando Retirada</p>
            <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <PackageCheck className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Entregues Hoje</p>
            <p className="text-2xl font-bold text-slate-900">{deliveredCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Registrado</p>
            <p className="text-2xl font-bold text-slate-900">{packages.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <AuditFilterBar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
      />

      {/* Package List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8 space-y-3">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Inbox className="size-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Nenhuma encomenda encontrada</p>
          <p className="text-xs text-slate-400">
            Ajuste os filtros de busca ou cadastre uma nova encomenda no botão Check-in.
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

