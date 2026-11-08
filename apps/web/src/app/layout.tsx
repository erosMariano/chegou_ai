import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/entities/user/ui/auth-provider"
import { SessionHeader } from "@/widgets/session-header/ui/session-header"
import { PwaInstallPrompt } from "@/features/pwa-install/ui/pwa-install-prompt"
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

export const viewport: Viewport = {
  themeColor: "#18181B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "Chegou.AI — Gestão e Aviso Inteligente de Encomendas",
  description:
    "Sistema inteligente de registro via IA multimodal e retirada segura de encomendas em condomínios.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chegou.AI",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/apple-touch-icon.png",
  },
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
          <PwaInstallPrompt />
          <main className="flex-1">{children}</main>
          <DevToolsDrawer />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  )
}
