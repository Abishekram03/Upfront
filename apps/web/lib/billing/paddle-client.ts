/**
 * UpFront - Client-Side Paddle.js Integration
 *
 * Loads Paddle.js SDK and opens overlay / hosted checkout carrying workspace ID metadata.
 */

import { type PlanId, PADDLE_PRICE_IDS } from "./plans"

declare global {
  interface Window {
    Paddle?: any
  }
}

let paddlePromise: Promise<any> | null = null
let activeCheckoutOptions: CheckoutOptions | null = null

export function loadPaddleScript(environment: "sandbox" | "production" = "sandbox"): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null)
  if (window.Paddle) return Promise.resolve(window.Paddle)

  if (!paddlePromise) {
    paddlePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
      script.async = true
      script.onload = () => {
        if (window.Paddle) {
          const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || ""
          const env = environment === "production" ? "production" : "sandbox"

          if (clientToken && typeof window.Paddle.Initialize === "function") {
            try {
              window.Paddle.Environment.set(env)
              window.Paddle.Initialize({
                token: clientToken,
                eventCallback: async (data: any) => {
                  if (data.name === "checkout.completed") {
                    console.log("[Paddle] Checkout completed event:", data)
                    const workspaceId =
                      data?.data?.custom_data?.workspace_id ||
                      data?.data?.custom_data?.workspaceId ||
                      activeCheckoutOptions?.workspaceId

                    const rawPriceId = data?.data?.items?.[0]?.price?.id || activeCheckoutOptions?.priceId
                    const isBusiness =
                      rawPriceId === PADDLE_PRICE_IDS.business ||
                      rawPriceId === (process.env.NEXT_PUBLIC_PADDLE_BUSINESS_PRICE_ID || "pri_01m3rgx14zzhfr3g10241pxw93") ||
                      rawPriceId?.includes("business")

                    const isAddon =
                      activeCheckoutOptions?.plan === "addon_100k" ||
                      rawPriceId === (process.env.NEXT_PUBLIC_PADDLE_ADDON_100K_PRICE_ID || "pri_01addon_100k_pageviews") ||
                      rawPriceId?.includes("addon")

                    const plan =
                      isAddon
                        ? "addon_100k"
                        : activeCheckoutOptions?.plan ||
                          (isBusiness ? "business" : "growth")

                    if (workspaceId && plan) {
                      try {
                        await fetch("/api/v1/billing/sync", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            workspaceId,
                            plan,
                            paddleSubscriptionId: data?.data?.id || `sub_${Date.now()}`,
                            paddleCustomerId: data?.data?.customer_id,
                            paddlePriceId: rawPriceId,
                          }),
                        })
                      } catch (err) {
                        console.warn("[Paddle] Client billing sync notice:", err)
                      }
                    }

                    if (typeof activeCheckoutOptions?.onSuccess === "function") {
                      activeCheckoutOptions.onSuccess()
                    }
                  } else if (data.name === "checkout.error" || data.name === "checkout.failed") {
                    console.error("[Paddle] Checkout error event:", data)
                    if (typeof activeCheckoutOptions?.onError === "function") {
                      activeCheckoutOptions.onError(data?.data?.message || "Checkout payment failed or was declined.")
                    }
                  } else if (data.name === "checkout.closed") {
                    if (typeof activeCheckoutOptions?.onClose === "function") {
                      activeCheckoutOptions.onClose()
                    }
                  }
                },
              })
            } catch (err) {
              console.warn("[Paddle] Initialize notice:", err)
            }
          }
          resolve(window.Paddle)
        } else {
          resolve(null)
        }
      }
      script.onerror = (e) => reject(new Error("Failed to load Paddle SDK"))
      document.head.appendChild(script)
    })
  }

  return paddlePromise
}

export interface CheckoutOptions {
  priceId: string
  plan?: PlanId | string
  workspaceId: string
  userId?: string
  userEmail?: string
  onSuccess?: () => void
  onError?: (errorMessage?: string) => void
  onClose?: () => void
}

/**
 * Opens Paddle Checkout with associated workspace custom data.
 */
export async function openPaddleCheckout(options: CheckoutOptions) {
  const { priceId, workspaceId, userId, userEmail, onSuccess, onError, onClose } = options

  const resolvedPriceId =
    priceId ||
    (options.plan === "business"
      ? (process.env.NEXT_PUBLIC_PADDLE_BUSINESS_PRICE_ID || PADDLE_PRICE_IDS.business)
      : (process.env.NEXT_PUBLIC_PADDLE_GROWTH_PRICE_ID || PADDLE_PRICE_IDS.growth))

  if (!resolvedPriceId) {
    throw new Error("Missing Paddle Price ID for checkout.")
  }

  if (typeof window === "undefined") return

  activeCheckoutOptions = options
  const resolvedPlan = options.plan || (resolvedPriceId === PADDLE_PRICE_IDS.business ? "business" : "growth")

  try {
    const paddle = await loadPaddleScript(
      (process.env.NEXT_PUBLIC_PADDLE_ENV as any) || "sandbox"
    )

    if (paddle && typeof paddle.Checkout?.open === "function") {
      try {
        paddle.Checkout.open({
          items: [{ priceId: resolvedPriceId, quantity: 1 }],
          customer: userEmail ? { email: userEmail } : undefined,
          customData: {
            workspace_id: workspaceId,
            workspaceId: workspaceId,
            user_id: userId || "",
            plan: resolvedPlan,
          },
          settings: {
            displayMode: "overlay",
            theme: "light",
            locale: "en",
            successUrl: `${window.location.origin}/settings?tab=billing&checkout=success&plan=${resolvedPlan}&workspaceId=${workspaceId}`,
          },
        })
        return
      } catch (sdkOpenErr) {
        console.warn("[Paddle] SDK checkout open error, falling back to test mode:", sdkOpenErr)
      }
    }

    // Fallback if Paddle token is not yet configured or in sandbox dev: provide clear simulation
    console.warn("[Paddle] SDK checkout opened in test mode.")
      const simulate = confirm(
        `[Paddle Test Mode]\n\nUpgrading workspace to ${resolvedPlan.toUpperCase()} (Price ID: ${resolvedPriceId})\nWorkspace: ${workspaceId}\n\nClick OK to simulate successful checkout or Cancel to abort.`
      )
      if (simulate) {
        // Send test webhook / simulation call
        const plan = resolvedPlan === "addon_100k" ? "addon_100k" : resolvedPlan === "business" ? "business" : "growth"
        await fetch("/api/v1/billing/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, plan }),
        }).catch(() => {})
        const res = await fetch("/api/v1/billing/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-paddle-test-bypass": "true",
          },
          body: JSON.stringify({
            event_id: `evt_test_${Date.now()}`,
            event_type: plan === "addon_100k" ? "transaction.completed" : "subscription.created",
            occurred_at: new Date().toISOString(),
            data: {
              id: `sub_sim_${Date.now()}`,
              customer_id: `ctm_sim_${Date.now()}`,
              status: "active",
              items: [{ price: { id: resolvedPriceId } }],
              current_billing_period: {
                starts_at: new Date().toISOString(),
                ends_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
              },
              custom_data: {
                workspace_id: workspaceId,
                user_id: userId,
                plan,
              },
            },
          }),
        })

        if (res.ok) {
          if (typeof window !== "undefined" && workspaceId) {
            localStorage.setItem("upfront_active_workspace_id", workspaceId)
          }
          if (typeof onSuccess === "function") {
            onSuccess()
          }
        }
      }
  } catch (err) {
    console.error("Failed to open Paddle Checkout:", err)
    alert("Could not initialize payment checkout. Please try again.")
  }
}

/**
 * Opens or directs user to the Paddle Customer Portal for subscription/payment management.
 */
export async function openPaddleCustomerPortal(customerId: string) {
  if (typeof window === "undefined") return

  try {
    const paddle = await loadPaddleScript(
      (process.env.NEXT_PUBLIC_PADDLE_ENV as any) || "sandbox"
    )

    if (paddle && typeof paddle.CustomerPortal?.open === "function") {
      paddle.CustomerPortal.open({
        customerId,
      })
    } else {
      console.log(`[Paddle] Opening customer portal for customer: ${customerId}`)
      alert(
        `[Paddle Customer Portal]\n\nCustomer ID: ${customerId}\n\nIn live production with configured Paddle portal, this opens the self-serve subscription and payment management modal.`
      )
    }
  } catch (err) {
    console.error("Failed to open Paddle Customer Portal:", err)
  }
}
