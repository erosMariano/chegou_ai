"use client"

import React, { useState } from "react"
import { UserOperator, CreateUserFormData, UpdateUserFormData } from "@/entities/user/model/types"
import { userPort } from "@/shared/ports"
import { UserDialog } from "@/features/manage-users/ui/user-dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { toast } from "sonner"
import {
  Users,
  UserCheck,
  ShieldAlert,
  Search,
  Plus,
  Power,
  Edit2,
  Trash2,
  Package,
  Shield,
  KeyRound,
} from "lucide-react"

interface UsersManagerWidgetProps {
  initialUsers: UserOperator[]
}

export function UsersManagerWidget({ initialUsers }: UsersManagerWidgetProps) {
  const [users, setUsers] = useState<UserOperator[]>(initialUsers || [])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"ALL" | "PORTER" | "ADMIN">("ALL")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserOperator | null>(null)
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null)

  // Filtros em memória
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter
    const term = search.toLowerCase().trim()
    const matchesSearch =
      !term ||
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    return matchesRole && matchesSearch
  })

  const activePorters = users.filter((u) => u.role === "PORTER" && u.isActive).length
  const totalPorters = users.filter((u) => u.role === "PORTER").length
  const totalAdmins = users.filter((u) => u.role === "ADMIN").length

  async function handleSaveUser(data: CreateUserFormData): Promise<UserOperator> {
    if (editingUser) {
      const updated = await userPort.updateUser(editingUser.id, {
        name: data.name,
        email: data.email,
        password: data.password && data.password !== "••••••••" ? data.password : undefined,
        role: data.role,
      })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      return updated
    } else {
      const created = await userPort.createUser(data)
      setUsers((prev) => [created, ...prev])
      return created
    }
  }

  async function handleToggleStatus(user: UserOperator) {
    try {
      setIsTogglingId(user.id)
      const updated = await userPort.toggleUserStatus(user.id)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: updated.isActive } : u))
      )
      toast.success(
        updated.isActive
          ? `Acesso de ${user.name} ativado com sucesso!`
          : `Acesso de ${user.name} inativado com sucesso!`
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar status do operador"
      toast.error(msg)
    } finally {
      setIsTogglingId(null)
    }
  }

  async function handleDelete(user: UserOperator) {
    if (
      !confirm(
        `Tem certeza que deseja remover ${user.name}? Se houver histórico de pacotes, ele será inativado.`
      )
    ) {
      return
    }

    try {
      const res = await userPort.deleteUser(user.id)
      if (res.deleted) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id))
      } else if (res.inactivated) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: false } : u))
        )
      }
      toast.success(res.message)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao remover operador"
      toast.error(msg)
    }
  }

  return (
    <div className="space-y-6">
      {/* Bento Grid Top KPIs com Hero Invertido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Hero Invertido (Estilo Vault) */}
        <div className="rounded-[24px] bg-zinc-900 text-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Porteiros em Atividade
            </span>
            <div className="size-9 rounded-xl bg-zinc-800 text-[#E1FF01] flex items-center justify-center">
              <UserCheck className="size-5" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-extrabold tracking-tight text-white">
              {activePorters}{" "}
              <span className="text-xs font-normal text-zinc-400">/ {totalPorters} ativos</span>
            </p>
            <p className="text-[11px] font-medium text-emerald-400 mt-0.5">
              &bull; Aptos para operar o terminal
            </p>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="bg-[#E1FF01] h-full"
              style={{
                width: totalPorters > 0 ? `${(activePorters / totalPorters) * 100}%` : "0%",
              }}
            />
          </div>
        </div>

        {/* KPI 2: Administradores */}
        <div className="rounded-[24px] bg-white border border-zinc-200/90 p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Gestores Gerais (Síndicos)
            </span>
            <div className="size-9 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Shield className="size-5" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-extrabold tracking-tight text-zinc-950">{totalAdmins}</p>
            <p className="text-[11px] font-medium text-zinc-500 mt-0.5">
              Controle de acesso irrestrito
            </p>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div className="bg-zinc-900 h-full w-full" />
          </div>
        </div>

        {/* KPI 3: Segurança & Rastreabilidade */}
        <div className="rounded-[24px] bg-white border border-zinc-200/90 p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Rastreio Individual
            </span>
            <div className="size-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Package className="size-5" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-extrabold tracking-tight text-emerald-700">100%</p>
            <p className="text-[11px] font-medium text-zinc-500 mt-0.5">
              Check-ins vinculados ao operador
            </p>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-full" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-[24px] border border-zinc-200/90 bg-white p-6 shadow-2xs space-y-5">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3 size-4 text-zinc-400" />
              <Input
                placeholder="Buscar operador por nome ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-10 rounded-full border-zinc-200 bg-zinc-50/50 text-xs focus-visible:bg-white"
              />
            </div>

            {/* Filter Pills */}
            <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-0.5 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setRoleFilter("ALL")}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  roleFilter === "ALL" ? "bg-zinc-900 text-white shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("PORTER")}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  roleFilter === "PORTER" ? "bg-zinc-900 text-white shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Porteiros
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("ADMIN")}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  roleFilter === "ADMIN" ? "bg-zinc-900 text-white shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Síndicos
              </button>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              setEditingUser(null)
              setDialogOpen(true)
            }}
            className="rounded-full bg-zinc-900 hover:bg-black text-white font-bold text-xs h-10 px-5 shadow-xs shrink-0"
          >
            <Plus className="size-4 mr-1 text-[#E1FF01]" />
            Cadastrar Operador
          </Button>
        </div>

        {/* Tabela de Operadores */}
        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Pacotes Registrados</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-400">
                    Nenhum operador encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-zinc-900">{user.name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">{user.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {user.role === "ADMIN" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-900 text-[#E1FF01]">
                          <Shield className="size-3" />
                          Síndico / Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                          <UserCheck className="size-3 text-zinc-500" />
                          Porteiro
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="size-1.5 rounded-full bg-emerald-600" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
                          <span className="size-1.5 rounded-full bg-zinc-400" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-zinc-700">
                      {user._count?.registeredPackages ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Toggle Status */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isTogglingId === user.id}
                          onClick={() => handleToggleStatus(user)}
                          title={user.isActive ? "Inativar acesso" : "Ativar acesso"}
                          className={`size-8 p-0 rounded-full ${
                            user.isActive
                              ? "text-zinc-600 hover:text-amber-700 hover:bg-amber-50"
                              : "text-zinc-400 hover:text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          <Power className="size-3.5" />
                        </Button>

                        {/* Edit */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user)
                            setDialogOpen(true)
                          }}
                          className="size-8 p-0 rounded-full text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                          title="Editar operador"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>

                        {/* Delete */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user)}
                          className="size-8 p-0 rounded-full text-zinc-400 hover:text-red-700 hover:bg-red-50"
                          title="Remover ou inativar"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingUser={editingUser}
        onSuccess={() => {}}
        onSaveUser={handleSaveUser}
      />
    </div>
  )
}

