"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { Loader2, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data, error: err } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/analytics",
      })

      if (err) {
        if (
          err.message?.toLowerCase().includes("two-factor") ||
          err.message?.toLowerCase().includes("two_factor") ||
          err.message?.toLowerCase().includes("totp") ||
          (data as any)?.twoFactorRedirect
        ) {
          router.push("/two-factor")
          return
        }
        setError(err.message || "Invalid email or password. If you don't have an account, please sign up.")
      } else if (data) {
        if ((data as any)?.twoFactorRedirect) {
          router.push("/two-factor")
          return
        }
        router.push("/analytics")
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("min-h-screen w-full grid lg:grid-cols-2 bg-white", className)} {...props}>
      {/* LEFT SIDE: Login Form */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-16 max-w-xl mx-auto w-full">
        {/* Brand Logo Header */}
        <div>
          <Link href="/" aria-label="UpFront Home" className="inline-block">
            <Image
              src="/logo/upfront-logo-black.svg"
              alt="UpFront"
              width={140}
              height={38}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Main Form Area */}
        <div className="my-auto py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-medium tracking-normal text-ink">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Sign in to your account to access your analytics dashboard and consent management tools.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-ink mb-1.5">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="h-11 rounded-lg border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-medium text-ink">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:text-brand-dark transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-11 rounded-lg border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-primary hover:bg-brand-dark text-white text-sm font-medium rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:text-brand-dark transition-colors underline-offset-2 hover:underline"
            >
              Start for free
            </Link>
          </p>
        </div>

        {/* Footer Legal Links */}
        <div className="pt-6 border-t border-line text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} UpFront by Syft Technologies</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-ink transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">
              Privacy
            </Link>
            <Link href="/docs" className="hover:text-ink transition-colors">
              Docs
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Visual Showcase with Mobile login-rafiki.svg */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-mist/80 via-surface to-brand-mist/40 border-l border-line relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-line px-3 py-1 text-xs font-medium text-primary shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            Privacy-first web platform
          </span>
          <span className="text-xs font-medium text-muted-foreground">Under 4KB script</span>
        </div>

        {/* Center Illustration */}
        <div className="relative z-10 my-auto flex flex-col items-center text-center px-4">
          <div className="relative w-full max-w-md h-72 sm:h-80 mb-6 drop-shadow-sm">
            <Image
              src="/illustrations/Mobile login-rafiki.svg"
              alt="Mobile Login Illustration"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-2xl font-medium tracking-normal text-ink max-w-md">
            Privacy analytics and consent in one lightweight script.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-sm">
            Zero raw IP storage, cookieless by default, and automated script blocking that respects user privacy.
          </p>
        </div>

        {/* Feature Highlights Footer */}
        <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-line/60 pt-6">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <span>Cookieless default</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <span>Consent Studio</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <span>Proof of Consent</span>
          </div>
        </div>
      </div>
    </div>
  )
}
