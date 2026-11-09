import { userPort } from "@/shared/ports"
import { AdminHeader } from "@/widgets/admin-header/ui/admin-header"
import { UsersManagerWidget } from "@/widgets/users-manager/ui/users-manager-widget"

export default async function AdminUsuariosPage() {
  const data = await userPort.listUsers()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <AdminHeader />
      <UsersManagerWidget initialUsers={data.items} />
    </div>
  )
}

