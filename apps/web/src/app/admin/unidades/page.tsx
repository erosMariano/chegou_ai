import { unitPort } from "@/shared/ports"
import { AdminHeader } from "@/widgets/admin-header/ui/admin-header"
import { UnitsManagerWidget } from "@/widgets/units-manager/ui/units-manager-widget"

export default async function AdminUnitsPage() {
  const [units, residents] = await Promise.all([
    unitPort.listUnits().catch(() => []),
    unitPort.listAllResidents().catch(() => []),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <AdminHeader />
      <UnitsManagerWidget initialUnits={units} initialResidents={residents} />
    </div>
  )
}

