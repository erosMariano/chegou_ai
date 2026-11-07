import { ConciergeHeader } from "@/widgets/concierge-header/ui/concierge-header"
import { PackageTableWidget } from "@/widgets/package-table/ui/package-table-widget"
import { packagePort } from "@/shared/ports"

export default async function PortariaPage() {
  const packages = await packagePort.listPackages()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <ConciergeHeader />
      <PackageTableWidget initialPackages={packages} />
    </div>
  )
}
