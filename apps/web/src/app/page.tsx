import Link from "next/link"
import { Shield, User, ShieldAlert, ArrowRight, Sparkles, QrCode, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700">
          <Sparkles className="size-3.5" />
          Protótipo Arquitetural FSD + SDD + Atomic Design
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
          Gestão Inteligente de Encomendas
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Plataforma para condomínios com extração multimodal zero-shot de etiquetas via IA,
          disparo assíncrono de notificações e retirada auditável por PIN e QR Code.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Porteiro Card */}
        <Card className="border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all flex flex-col">
          <CardHeader>
            <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-2">
              <Shield className="size-6" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Terminal do Porteiro
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Check-in rápido com câmera/IA, visualização do estoque de pacotes e baixa com PIN.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-4">
            <Link href="/portaria">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs">
                Acessar Portaria
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Morador Card */}
        <Card className="border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all flex flex-col">
          <CardHeader>
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-2">
              <User className="size-6" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Portal do Morador
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Recebimento de Web Push, QR Code dinâmico e código PIN para retirada na portaria.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-4">
            <Link href="/morador">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs">
                Acessar Portal do Morador
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Sindico Card */}
        <Card className="border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all flex flex-col">
          <CardHeader>
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 mb-2">
              <ShieldAlert className="size-6" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Painel do Síndico / Admin
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Trilha de auditoria append-only (`package_events`), métricas de entrega e conformidade LGPD.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-4">
            <Link href="/admin">
              <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs">
                Acessar Painel Síndico
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span>90% shadcn/ui &bull; 10% Magic UI (BorderBeam & ShineBorder)</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Ports & Adapters integrados em memória (Mock com schema PostgreSQL)</span>
        </div>
      </div>
    </div>
  )
}
