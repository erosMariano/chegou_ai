"use client"

import { AuthGuard } from "@/features/auth/ui/auth-guard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard allowedRoles={["ADMIN"]}>{children}</AuthGuard>
}

