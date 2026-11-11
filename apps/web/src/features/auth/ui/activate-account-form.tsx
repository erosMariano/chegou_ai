"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/entities/user/ui/auth-provider"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Card, CardContent } from "@/shared/ui/card"
import { toast } from "sonner"
import { Lock, CheckCircle2, ArrowRight } from "lucide-react"

interface ActivateAccountFieldsProps {
  initialEmail: string
  initialToken: string
}

function ActivateAccountFields({ initialEmail, initialToken }: ActivateAccountFieldsProps) {
  const router = useRouter()
  const { activateAccount } = useAuth()
  const [email, setEmail] = useState(initialEmail)
  const [token, setToken] = useState(initialToken)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

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
      await activateAccount({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        password,
      })

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
  )
}

export function ActivateAccountForm() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email") || ""
  const tokenParam = searchParams.get("token") || ""

  return (
    <ActivateAccountFields
      key={`${emailParam}-${tokenParam}`}
      initialEmail={emailParam}
      initialToken={tokenParam}
    />
  )
}
