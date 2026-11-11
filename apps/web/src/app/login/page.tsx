"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/entities/user/ui/auth-provider"
import { UserRole } from "@/shared/ports/IAuthGateway"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Card, CardContent } from "@/shared/ui/card"
import { DemoQuickLoginCards } from "@/shared/dev-tools/demo-quick-login-cards"
import { isMockUiEnabled } from "@/shared/dev-tools/config"
import { toast } from "sonner"
import { Sparkles, Lock, Mail, Building2, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { user, isLoading, login, loginAsDemo, getSetupStatus } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false)

  // Redirect if already logged in, or check if condominium onboarding is needed
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "PORTER") router.replace("/portaria")
      else if (user.role === "RESIDENT") router.replace("/morador")
      else if (user.role === "ADMIN") router.replace("/admin")
      return
    }

    if (!isLoading && !user) {
      let isMounted = true
      getSetupStatus()
        .then((status) => {
          if (isMounted) {
            setNeedsInitialSetup(!status.initialized)
          }
        })
        .catch(() => {})
      return () => {
        isMounted = false
      }
    }
  }, [user, isLoading, router, getSetupStatus])

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setErrorMsg("Informe seu e-mail cadastrado")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg(null)
      const session = await login({ email, password })
      toast.success(`Bem-vindo, ${session.name}!`)

      // Limpa os campos do formulário após login bem-sucedido
      setEmail("")
      setPassword("")

      if (session.role === "PORTER") router.push("/portaria")
      else if (session.role === "RESIDENT") router.push("/morador")
      else if (session.role === "ADMIN") router.push("/admin")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao efetuar login"
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleQuickDemoLogin(role: UserRole) {
    try {
      setIsSubmitting(true)
      setErrorMsg(null)
      const session = await loginAsDemo(role)
      toast.success(`Entrando como ${session.name}...`)

      // Limpa os campos do formulário
      setEmail("")
      setPassword("")

      if (session.role === "PORTER") router.push("/portaria")
      else if (session.role === "RESIDENT") router.push("/morador")
      else if (session.role === "ADMIN") router.push("/admin")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar como demo"
      setErrorMsg(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F3]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
          <p className="text-xs font-medium text-zinc-500">Redirecionando para seu painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-[#F4F4F3] text-zinc-900">
      <div className="w-full max-w-md space-y-7">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold shadow-xs">
            <span className="size-2 rounded-full bg-[#E1FF01] animate-pulse" />
            <span>CHEGOU<span className="text-zinc-400">.AI</span></span>
            <span className="text-[10px] text-zinc-400 font-normal ml-1">Condomínios</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            Acesso ao Sistema
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-xs mx-auto">
            Plataforma inteligente de encomendas com visão computacional para condomínios
          </p>
        </div>

        {/* Opção visível EXCLUSIVAMENTE quando nenhum condomínio/síndico foi configurado ainda */}
        {needsInitialSetup && (
          <div className="rounded-xl border border-zinc-900/15 bg-zinc-900 text-white p-4 shadow-sm flex flex-col gap-3 animate-in fade-in-50 duration-300">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-lg bg-[#E1FF01] text-zinc-950 flex items-center justify-center shrink-0">
                <Building2 className="size-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm font-extrabold tracking-tight">
                  Nenhum condomínio configurado
                </h2>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Inicie do zero criando seu condomínio, endereço oficial e a conta do síndico.
                </p>
              </div>
            </div>
            <Link
              href="/criar-condominio"
              className="w-full h-9 rounded-full bg-[#E1FF01] hover:bg-[#d5f500] text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Criar Meu Condomínio</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}

        {/* 1-Tap Demo Quick Access (Isolated in shared/dev-tools) */}
        <DemoQuickLoginCards
          onSelectRole={handleQuickDemoLogin}
          disabled={isSubmitting}
        />

        {/* Divider if Mock UI is enabled */}
        {isMockUiEnabled() && (
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-300/80" />
            </div>
            <span className="relative bg-[#F4F4F3] px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              ou credenciais de acesso
            </span>
          </div>
        )}

        {/* Main Clean Login Card */}
        <Card className="rounded-lg border border-zinc-200/90 bg-white shadow-xs p-6">
          <CardContent className="p-0">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-zinc-700">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 size-4 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ex: porteiro@chegou.ai"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errorMsg) setErrorMsg(null)
                    }}
                    className="pl-10 h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm focus-visible:bg-white focus-visible:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-zinc-700">
                    Senha
                  </Label>
                  <span className="text-[11px] text-zinc-400">Padrão demo: 123456</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 size-4 text-zinc-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errorMsg) setErrorMsg(null)
                    }}
                    className="pl-10 h-10 rounded-lg border-zinc-200 bg-zinc-50/50 text-sm focus-visible:bg-white focus-visible:ring-zinc-900"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 rounded-full bg-zinc-900 hover:bg-black text-white font-bold text-xs shadow-xs"
              >
                {isSubmitting ? "Autenticando..." : "Entrar no Sistema"}
              </Button>

              <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                <Link
                  href="/esqueci-minha-senha"
                  className="hover:text-zinc-900 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
                <Link
                  href="/ativar-conta"
                  className="text-zinc-800 font-bold hover:underline"
                >
                  Primeiro acesso? Ativar conta
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5">
          <Sparkles className="size-3 text-zinc-400" />
          Conformidade com LGPD &bull; Sessão segura em memória
        </p>
      </div>
    </div>
  )
}
