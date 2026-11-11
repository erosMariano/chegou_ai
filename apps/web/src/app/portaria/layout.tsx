import { AuthGuard } from "@/features/auth/ui/auth-guard"

export default function PortariaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard allowedRoles={["PORTER", "ADMIN"]}>{children}</AuthGuard>
}

