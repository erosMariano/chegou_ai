import { unitPort } from "@/shared/ports"
import { AdminHeader } from "@/widgets/admin-header/ui/admin-header"
import { ResidentsManagerWidget } from "@/widgets/residents-manager/ui/residents-manager-widget"

export default async function AdminResidentsPage() {
  const residents = await unitPort.listAllResidents()
  const units = await unitPort.listUnits()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <AdminHeader />
      <ResidentsManagerWidget initialResidents={residents} units={units} />
    </div>
  )
}

