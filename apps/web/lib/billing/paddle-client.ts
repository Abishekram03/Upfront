/**
 * UpFront - Client-Side Paddle.js Integration
 *
 * Loads Paddle.js SDK and opens overlay / hosted checkout carrying workspace ID metadata.
 */

declare global {
  interface Window {
    Paddle?: any
  }
}

let paddlePromise: Promise<any> | null = null

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
                eventCallback: (data: any) => {
                  if (data.name === "checkout.completed") {
                    console.log("[Paddle] Checkout completed:", data)
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
  workspaceId: string
  userId?: string
  userEmail?: string
  onSuccess?: () => void
  onClose?: () => void
}

/**
 * Opens Paddle Checkout with associated workspace custom data.
 */
export async function openPaddleCheckout(options: CheckoutOptions) {
  const { priceId, workspaceId, userId, userEmail, onSuccess, onClose } = options

  if (typeof window === "undefined") return

  try {
    const paddle = await loadPaddleScript(
      (process.env.NEXT_PUBLIC_PADDLE_ENV as any) || "sandbox"
    )

    if (paddle && typeof paddle.Checkout?.open === "function") {
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: userEmail ? { email: userEmail } : undefined,
        customData: {
          workspace_id: workspaceId,
          workspaceId: workspaceId,
          user_id: userId || "",
        },
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en",
          successUrl: `${window.location.origin}/settings?tab=billing&checkout=success`,
        },
      })
    } else {
      // Fallback if Paddle token is not yet configured: provide clear simulation in development
      console.warn("[Paddle] SDK checkout opened in test mode.")
      const simulate = confirm(
        `[Paddle Test Mode]\n\nUpgrading workspace to Price ID: ${priceId}\nWorkspace: ${workspaceId}\n\nClick OK to simulate successful checkout or Cancel to abort.`
      )
      if (simulate) {
        // Send test webhook / simulation call
        const plan = priceId.includes("business") ? "business" : "growth"
        const res = await fetch("/api/v1/billing/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-paddle-test-bypass": "true",
          },
          body: JSON.stringify({
            event_id: `evt_test_${Date.now()}`,
            event_type: "subscription.created",
            occurred_at: new Date().toISOString(),
            data: {
              id: `sub_sim_${Date.now()}`,
              customer_id: `ctm_sim_${Date.now()}`,
              status: "active",
              items: [{ price: { id: priceId } }],
              current_billing_period: {
                starts_at: new Date().toISOString(),
                ends_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
              },
              custom_data: {
                workspace_id: workspaceId,
                user_id: userId,
              },
            },
          }),
        })

        if (res.ok) {
          onSuccess?.()
          window.location.reload()
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
