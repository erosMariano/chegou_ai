"use client"

import { AuthGuard } from "@/features/auth/ui/auth-guard"

export default function MoradorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard allowedRoles={["RESIDENT", "ADMIN"]}>{children}</AuthGuard>
}

