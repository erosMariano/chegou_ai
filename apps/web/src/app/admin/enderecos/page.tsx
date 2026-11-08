import { condominiumPort } from "@/shared/ports"
import { AdminHeader } from "@/widgets/admin-header/ui/admin-header"
import { AddressesManagerWidget } from "@/widgets/addresses-manager/ui/addresses-manager-widget"

export default async function AdminAddressesPage() {
  const addresses = await condominiumPort.listAddresses()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <AdminHeader />
      <AddressesManagerWidget initialAddresses={addresses} />
    </div>
  )
}

