/**
 * UpFront - Open Source Billing Mock
 *
 * Commercial billing and checkout are disabled in the open source edition.
 * All features, capabilities, and quotas are 100% unlocked for everyone.
 */

export async function loadPaddleScript() {
  return null
}

export interface CheckoutOptions {
  plan?: string
  priceId?: string
  workspaceId?: string
  userId?: string
  userEmail?: string
  userName?: string
  onSuccess?: () => void
  onError?: (err: any) => void
  onClose?: () => void
}

export async function openPaddleCheckout(options: CheckoutOptions = {}) {
  console.log("[UpFront Open Source] Billing checkout is disabled. All features are fully unlocked.")
  if (typeof options.onSuccess === "function") {
    options.onSuccess()
  }
}

export async function openPaddleCustomerPortal(customerId?: string) {
  console.log("[UpFront Open Source] Customer billing portal is disabled in open-source edition.")
}
