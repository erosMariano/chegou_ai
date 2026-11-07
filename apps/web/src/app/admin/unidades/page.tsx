import { unitPort } from "@/shared/ports"
import { AdminHeader } from "@/widgets/admin-header/ui/admin-header"
import { UnitsManagerWidget } from "@/widgets/units-manager/ui/units-manager-widget"

export default async function AdminUnitsPage() {
  const units = await unitPort.listUnits()
  const residents = await unitPort.listAllResidents()

  // Mapeia moradores por unidade
  const residentCounts: Record<string, number> = {}
  residents.forEach((r) => {
    residentCounts[r.unitId] = (residentCounts[r.unitId] || 0) + 1
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <AdminHeader />
      <UnitsManagerWidget initialUnits={units} residentCounts={residentCounts} />
    </div>
  )
}

