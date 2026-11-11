import type { Metadata } from "next"
import Link from "next/link"
import { Sparkles, ArrowLeft } from "lucide-react"
import { SetupCondominiumGate } from "@/features/setup-condominium/ui/setup-condominium-gate"

export const metadata: Metadata = {
  title: "Criar Condomínio | Chegou.AI",
  description:
    "Configure o perfil do seu condomínio, endereço oficial e a conta principal do síndico.",
}

export default function CriarCondominioPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-[#F4F4F3] text-zinc-900">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold shadow-xs">
            <span className="size-2 rounded-full bg-[#E1FF01] animate-pulse" />
            <span>
              CHEGOU<span className="text-zinc-400">.AI</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-normal ml-1">
              Configuração Inicial
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            Criar Meu Condomínio
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto">
            Configure o perfil do seu condomínio, endereço oficial para a IA e a conta principal do síndico para iniciar a operação.
          </p>
        </div>

        <SetupCondominiumGate />

        <div className="flex flex-col items-center gap-2 pt-1">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Voltar para a tela de Login
          </Link>

          <p className="text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5">
            <Sparkles className="size-3 text-zinc-400" />
            Conformidade com LGPD &bull; Setup atômico seguro
          </p>
        </div>
      </div>
    </div>
  )
}
