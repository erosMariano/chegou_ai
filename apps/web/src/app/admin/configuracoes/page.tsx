import { condominiumPort } from "@/shared/ports"
import { AdminHeader } from "@/widgets/admin-header/ui/admin-header"
import { CondoSettingsWidget } from "@/widgets/condo-settings/ui/condo-settings-widget"
import { AddressesManagerWidget } from "@/widgets/addresses-manager/ui/addresses-manager-widget"

export default async function AdminConfiguracoesPage() {
  const addresses = await condominiumPort.listAddresses().catch(() => [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <AdminHeader />
      <CondoSettingsWidget />
      <AddressesManagerWidget initialAddresses={addresses} />
    </div>
  )
}

