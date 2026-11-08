import { ConciergeHeader } from "@/widgets/concierge-header/ui/concierge-header"
import { ScanForm } from "@/features/scan-label/ui/scan-form"
import { unitPort } from "@/shared/ports"


export default async function CheckinPage() {
  const units = await unitPort.listUnits()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <ConciergeHeader />
      <ScanForm units={units} />
    </div>
  )
}
