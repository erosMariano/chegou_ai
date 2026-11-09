"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  CreateUserFormSchema,
  CreateUserFormData,
  UserOperator,
} from "@/entities/user/model/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { toast } from "sonner"
import { KeyRound, Copy, Check, ShieldCheck, UserCheck } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  PORTER: "Porteiro (Operação da Portaria)",
  ADMIN: "Síndico / Administrador Geral",
}

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (user: UserOperator) => void
  onSaveUser: (data: CreateUserFormData) => Promise<UserOperator>
  editingUser?: UserOperator | null
}

export function UserDialog({
  open,
  onOpenChange,
  onSuccess,
  onSaveUser,
  editingUser,
}: UserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "PORTER",
    },
  })

  const currentRole = watch("role")
  const currentPassword = watch("password")

  useEffect(() => {
    if (editingUser) {
      reset({
        name: editingUser.name,
        email: editingUser.email,
        password: "••••••••", // Placeholder simbólico se não for alterar
        role: editingUser.role === "ADMIN" ? "ADMIN" : "PORTER",
      })
    } else {
      generateRandomPassword()
    }
  }, [editingUser, open, reset])

  function generateRandomPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$"
    let pass = ""
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setValue("password", pass, { shouldValidate: true })
  }

  function handleCopyPassword() {
    if (currentPassword) {
      navigator.clipboard.writeText(currentPassword)
      setCopiedPassword(true)
      toast.success("Senha temporária copiada para a área de transferência!")
      setTimeout(() => setCopiedPassword(false), 2500)
    }
  }

  async function onSubmit(data: CreateUserFormData) {
    try {
      setIsSubmitting(true)
      const saved = await onSaveUser(data)
      toast.success(
        editingUser
          ? `Dados de ${saved.name} atualizados com sucesso!`
          : `Operador ${saved.name} cadastrado com sucesso!`
      )
      onSuccess(saved)
      onOpenChange(false)
      reset()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar operador"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[24px] border border-zinc-200 bg-white p-6 shadow-xl">
        <DialogHeader className="space-y-1.5">
          <div className="size-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center mb-1">
            <UserCheck className="size-5 text-[#E1FF01]" />
          </div>
          <DialogTitle className="text-lg font-extrabold text-zinc-950 tracking-tight">
            {editingUser ? "Editar Operador" : "Cadastrar Novo Operador"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Cadastre porteiros ou administradores para gerenciar encomendas e turnos no condomínio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-bold text-zinc-700">
              Nome Completo *
            </Label>
            <Input
              id="name"
              placeholder="Ex: Carlos Alberto da Silva"
              {...register("name")}
              className="h-10 rounded-xl border-zinc-200 bg-zinc-50/50 text-sm focus-visible:bg-white"
            />
            {errors.name && (
              <p className="text-[11px] text-red-600 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-zinc-700">
              E-mail Institucional de Login *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="porteiro.carlos@condominio.com.br"
              {...register("email")}
              className="h-10 rounded-xl border-zinc-200 bg-zinc-50/50 text-sm focus-visible:bg-white"
            />
            {errors.email && (
              <p className="text-[11px] text-red-600 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Perfil Operacional */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Perfil de Acesso *</Label>
            <Select
              value={currentRole}
              onValueChange={(val) => {
                if (val === "PORTER" || val === "ADMIN") {
                  setValue("role", val, { shouldValidate: true })
                }
              }}
            >
              <SelectTrigger className="h-10 rounded-xl border-zinc-200 bg-zinc-50/50 text-xs font-bold text-zinc-800">
                <SelectValue placeholder="Selecione o perfil">
                  {(val: unknown) => {
                    const roleKey = (typeof val === "string" ? val : currentRole) as string
                    return ROLE_LABELS[roleKey] || (roleKey === "PORTER" ? "Porteiro" : roleKey)
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="PORTER">
                  <div className="flex flex-col text-left py-0.5">
                    <span className="font-semibold text-zinc-900">Porteiro (Operação da Portaria)</span>
                    <span className="text-[10px] text-zinc-500 font-normal">
                      Acesso a check-in com IA, check-out por PIN e lista de pacotes
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div className="flex flex-col text-left py-0.5">
                    <span className="font-semibold text-zinc-900">Síndico / Administrador Geral</span>
                    <span className="text-[10px] text-zinc-500 font-normal">
                      Acesso a cadastros, equipe, auditoria e métricas
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-bold text-zinc-700">
                {editingUser ? "Nova Senha (opcional)" : "Senha Temporária de Acesso *"}
              </Label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[10px] font-bold text-zinc-600 hover:text-zinc-900 underline"
              >
                Gerar outra
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                {...register("password")}
                className="h-10 rounded-xl border-zinc-200 bg-zinc-50/50 font-mono text-xs pr-10 focus-visible:bg-white"
              />
              <button
                type="button"
                onClick={handleCopyPassword}
                className="absolute right-2 top-2.5 p-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60"
                title="Copiar senha"
              >
                {copiedPassword ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-red-600 font-medium">{errors.password.message}</p>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-full border-zinc-200 text-xs flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold px-6 flex-1 shadow-xs"
            >
              {isSubmitting ? "Salvando..." : editingUser ? "Salvar Alterações" : "Criar Operador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
