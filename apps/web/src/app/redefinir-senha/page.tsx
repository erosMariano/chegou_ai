import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { Package } from "lucide-react"
import { ResetPasswordForm } from "@/features/auth/ui/reset-password-form"

export const metadata: Metadata = {
  title: "Redefinir Senha | Chegou.AI",
  description: "Crie uma nova senha de acesso ao Chegou.AI.",
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen bg-[#F4F4F3] flex flex-col justify-center items-center p-4">
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

        <Suspense
          fallback={
            <div className="text-center text-xs text-zinc-400 py-8">
              Carregando formulário...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>

        <div className="text-center text-xs text-zinc-500">
          Lembrou da senha?{" "}
          <Link href="/login" className="font-bold text-zinc-950 hover:underline">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  )
}
