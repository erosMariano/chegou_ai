"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Card, CardContent } from "@/shared/ui/card"
import { toast } from "sonner"
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { getApiBaseUrl } from "@/shared/adapters/http/http-client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      toast.error("Informe seu e-mail cadastrado.")
      return
    }

    try {
      setIsSubmitting(true)
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || err.message || "Erro ao solicitar recuperação.")
      }

      setIsSent(true)
      toast.success("Instruções de redefinição enviadas!")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na recuperação"
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
            <span>Chegou.AI &bull; Segurança</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            Recuperação de Acesso
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto">
            Informe seu e-mail cadastrado para redefinir sua senha de acesso.
          </p>
        </div>

        {/* Card */}
        <Card className="rounded-[24px] border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-5">
            {isSent ? (
              <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
                <div className="size-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="size-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-extrabold text-zinc-950">Solicitação Enviada!</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Se o e-mail informado estiver registrado em nossa base, as instruções para redefinição foram encaminhadas.
                </p>
                <div className="pt-2">
                  <Link href="/login">
                    <Button
                      type="button"
                      className="rounded-full bg-zinc-900 hover:bg-black text-white font-bold text-xs h-10 px-6 shadow-xs"
                    >
                      Voltar ao Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-zinc-700">
                    E-mail Cadastrado
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@condominio.com.br"
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
                  {isSubmitting ? "Enviando solicitação..." : "Enviar Instruções"}
                </Button>

                <div className="pt-2 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <ArrowLeft className="size-3" />
                    Voltar para tela de login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

