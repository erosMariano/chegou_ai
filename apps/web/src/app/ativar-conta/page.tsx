"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Card, CardContent } from "@/shared/ui/card"
import { toast } from "sonner"
import { Lock, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react"
import { getApiBaseUrl } from "@/shared/adapters/http/http-client"

function ActivateAccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email") || ""
  const tokenParam = searchParams.get("token") || ""

  const [email, setEmail] = useState(emailParam)
  const [token, setToken] = useState(tokenParam)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (emailParam) setEmail(emailParam)
    if (tokenParam) setToken(tokenParam)
  }, [emailParam, tokenParam])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email.trim()) {
      toast.error("Informe seu e-mail cadastrado.")
      return
    }

    if (!token.trim()) {
      toast.error("Token de ativação ausente. Utilize o link recebido no convite.")
      return
    }

    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("As senhas digitadas não coincidem.")
      return
    }

    try {
      setIsSubmitting(true)
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/auth/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token: token.trim(),
          password,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || err.message || "Erro ao ativar conta.")
      }

      const session = await res.json()
      if (session.token) {
        localStorage.setItem("chegou_session", JSON.stringify(session))
      }

      setIsSuccess(true)
      toast.success("Conta ativada com sucesso! Bem-vindo ao Chegou.AI.")
      setTimeout(() => {
        router.push("/morador")
      }, 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao ativar conta"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-[#F4F4F3] text-zinc-900">
      <div className="w-full max-w-md space-y-7">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-semibold shadow-xs">
            <Sparkles className="size-3.5 text-[#E1FF01]" />
            <span>Chegou.AI &bull; Primeiro Acesso</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            Ativação de Conta do Morador
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto">
            Crie sua senha de acesso para receber notificações push de encomendas e visualizar seu QR Code de retirada.
          </p>
        </div>

        {/* Card Form */}
        <Card className="rounded-[24px] border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-5">
            {isSuccess ? (
              <div className="text-center py-6 space-y-3 animate-in zoom-in-95">
                <div className="size-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="size-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-extrabold text-zinc-950">
                  Senha cadastrada com sucesso!
                </h3>
                <p className="text-xs text-zinc-500">
                  Redirecionando para seu Portal do Morador...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-zinc-700">
                    Seu E-mail Cadastrado
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@gmail.com"
                    required
                    className="h-11 rounded-xl border-zinc-200 bg-zinc-50/50 text-xs sm:text-sm focus-visible:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="token" className="text-xs font-bold text-zinc-700">
                    Código / Token do Convite
                  </Label>
                  <Input
                    id="token"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Cole o token do convite recebido"
                    required
                    className="h-11 rounded-xl border-zinc-200 bg-zinc-50/50 font-mono text-xs sm:text-sm focus-visible:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pass" className="text-xs font-bold text-zinc-700">
                    Crie uma Nova Senha (mínimo 6 caracteres)
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                    <Input
                      id="pass"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-11 pl-10 rounded-xl border-zinc-200 bg-zinc-50/50 text-xs sm:text-sm focus-visible:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPass" className="text-xs font-bold text-zinc-700">
                    Confirme sua Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                    <Input
                      id="confirmPass"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-11 pl-10 rounded-xl border-zinc-200 bg-zinc-50/50 text-xs sm:text-sm focus-visible:bg-white"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-full bg-zinc-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
                >
                  {isSubmitting ? (
                    "Ativando conta..."
                  ) : (
                    <>
                      Ativar Conta &amp; Acessar
                      <ArrowRight className="size-4 ml-1.5 text-[#E1FF01]" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ActivateAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F4F4F3]">
          <div className="size-8 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ActivateAccountContent />
    </Suspense>
  )
}

