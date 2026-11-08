import { ConciergeHeader } from "@/widgets/concierge-header/ui/concierge-header"
import { PinCheckoutForm } from "@/features/pin-checkout/ui/pin-checkout-form"

export const instant = false

export default function CheckoutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <ConciergeHeader />
      <PinCheckoutForm />
    </div>
  )
}

