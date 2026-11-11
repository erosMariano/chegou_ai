import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, PackageSearch } from "lucide-react"

export const metadata: Metadata = {
  title: "Página não encontrada | Chegou.AI",
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-[#F4F4F3] text-zinc-900">
      <div className="w-full max-w-md rounded-[24px] border border-zinc-200/90 bg-white p-8 shadow-xs text-center space-y-5">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-zinc-900 text-[#E1FF01] mx-auto shadow-xs">
          <PackageSearch className="size-7" />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Erro 404</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">
            Página não encontrada
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            O endereço acessado não existe ou foi movido dentro do Chegou.AI.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-full bg-zinc-900 hover:bg-black text-white font-bold text-xs shadow-xs transition-colors"
        >
          <ArrowLeft className="size-3.5 text-[#E1FF01]" />
          Voltar ao Início
        </Link>
      </div>
    </div>
  )
}

