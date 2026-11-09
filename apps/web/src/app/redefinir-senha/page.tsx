"use client"

import React, { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Package, Lock, CheckCircle2, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "sonner"
import { httpPost } from "@/shared/adapters/http/http-client"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [token, setToken] = useState(searchParams.get("token") || "")
  const [email, setEmail] = useState(searchParams.get("email") || "")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!token.trim()) {
      toast.error("Token de validação é obrigatório.")
      return
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Informe um e-mail válido.")
      return
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres.")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.")
      return
    }

    try {
      setIsLoading(true)
      await httpPost("/auth/reset-password", {
        token: token.trim(),
        email: email.trim().toLowerCase(),
        newPassword,
      })

      setIsSuccess(true)
      toast.success("Senha redefinida com sucesso!", {
        description: "Você já pode fazer login com suas novas credenciais.",
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao redefinir senha."
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex size-14 items-center justify-center rounded-[20px] bg-[#18181B] text-[#E1FF01] shadow-lg border border-zinc-800">
          <Package className="size-7" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">
          Redefinir Senha
        </h1>
        <p className="text-xs text-zinc-500 max-w-xs mx-auto">
          Crie uma nova credencial segura para acessar o Chegou.AI.
        </p>
      </div>

      <div className="rounded-[24px] border border-zinc-200/90 bg-white p-7 shadow-sm">
        {isSuccess ? (
          <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95">
            <div className="size-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="size-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-zinc-950">
                Senha alterada com sucesso!
              </h2>
              <p className="text-xs text-zinc-500">
                Sua conta foi atualizada. Agora você pode efetuar login e gerenciar suas encomendas.
              </p>
            </div>
            <Button
              onClick={() => router.push("/login")}
              className="w-full rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs h-10 gap-2 shadow-xs"
            >
              <span>Ir para o Login</span>
              <ArrowRight className="size-4 text-[#E1FF01]" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-zinc-700">
                E-mail cadastrado
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="h-10 rounded-xl border-zinc-200 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="token" className="text-xs font-bold text-zinc-700">
                Token / Código de Redefinição
              </Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole o token recebido"
                className="h-10 rounded-xl border-zinc-200 font-mono text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-bold text-zinc-700">
                Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="h-10 rounded-xl border-zinc-200 text-xs pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-bold text-zinc-700">
                Confirmar Nova Senha
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="h-10 rounded-xl border-zinc-200 text-xs"
                required
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs h-10 gap-2 shadow-xs"
              >
                {isLoading ? (
                  <span>Atualizando...</span>
                ) : (
                  <>
                    <Lock className="size-3.5 text-[#E1FF01]" />
                    <span>Salvar Nova Senha</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="text-center text-xs text-zinc-500">
        Lembrou da senha?{" "}
        <Link href="/login" className="font-bold text-zinc-950 hover:underline">
          Voltar ao login
        </Link>
      </div>
    </div>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen bg-[#F4F4F3] flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-xs text-zinc-400">Carregando formulário...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}

