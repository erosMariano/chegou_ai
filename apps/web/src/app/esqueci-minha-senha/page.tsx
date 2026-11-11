import type { Metadata } from "next"
import { Sparkles } from "lucide-react"
import { ForgotPasswordForm } from "@/features/auth/ui/forgot-password-form"

export const metadata: Metadata = {
  title: "Recuperação de Acesso | Chegou.AI",
  description: "Recupere sua senha de acesso ao sistema Chegou.AI.",
}

export default function ForgotPasswordPage() {
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

        <ForgotPasswordForm />
      </div>
    </div>
  )
}
