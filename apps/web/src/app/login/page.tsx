import type { Metadata } from "next"
import { Sparkles } from "lucide-react"
import { LoginForm } from "@/features/auth/ui/login-form"

export const metadata: Metadata = {
  title: "Login | Chegou.AI",
  description:
    "Plataforma inteligente de encomendas com visão computacional para condomínios.",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-[#F4F4F3] text-zinc-900">
      <div className="w-full max-w-md space-y-7">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold shadow-xs">
            <span className="size-2 rounded-full bg-[#E1FF01] animate-pulse" />
            <span>
              CHEGOU<span className="text-zinc-400">.AI</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-normal ml-1">Condomínios</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            Acesso ao Sistema
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-xs mx-auto">
            Plataforma inteligente de encomendas com visão computacional para condomínios
          </p>
        </div>

        <LoginForm />

        {/* Footer Note */}
        <p className="text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5">
          <Sparkles className="size-3 text-zinc-400" />
          Conformidade com LGPD &bull; Sessão segura em memória
        </p>
      </div>
    </div>
  )
}
