import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/entities/user/ui/auth-provider"
import { SessionHeader } from "@/widgets/session-header/ui/session-header"
import { DevToolsDrawer } from "@/shared/dev-tools/dev-tools-drawer"
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
      <body className="min-h-full flex flex-col bg-[#F4F4F3] text-zinc-900 font-sans">
        <AuthProvider>
          <SessionHeader />
          <main className="flex-1">{children}</main>
          <DevToolsDrawer />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  )
}
