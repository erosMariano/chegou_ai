import { AdminHeader } from "@/widgets/admin-header/ui/admin-header"
import { CondoSettingsWidget } from "@/widgets/condo-settings/ui/condo-settings-widget"

export default function AdminConfiguracoesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <AdminHeader />
      <CondoSettingsWidget />
    </div>
  )
}

