import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { DevRoleSwitcher } from "@/widgets/dev-role-switcher/ui/dev-role-switcher"
import { Toaster } from "@/shared/ui/sonner"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Chegou.AI — Gestão e Aviso Inteligente de Encomendas",
  description:
    "Sistema inteligente de registro via IA multimodal e retirada segura de encomendas em condomínios.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <DevRoleSwitcher />
        <main className="flex-1">{children}</main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
