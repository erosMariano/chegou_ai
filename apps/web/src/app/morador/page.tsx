import { packagePort } from "@/shared/ports"
import { ResidentPortalView } from "@/widgets/resident-portal/ui/resident-portal-view"

export const instant = false

export default async function MoradorPage() {
  const allPackages = await packagePort.listPackages()

  return <ResidentPortalView initialPackages={allPackages} />
}
