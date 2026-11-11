import type { Metadata } from "next"
import { Suspense } from "react"
import { Sparkles } from "lucide-react"
import { ActivateAccountForm } from "@/features/auth/ui/activate-account-form"

export const metadata: Metadata = {
  title: "Ativação de Conta | Chegou.AI",
  description: "Ative sua conta de morador no Chegou.AI e configure sua senha.",
}

export default function ActivateAccountPage() {
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

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="size-8 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
            </div>
          }
        >
          <ActivateAccountForm />
        </Suspense>
      </div>
    </div>
  )
}
