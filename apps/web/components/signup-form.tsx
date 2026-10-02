"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { createSite } from "@/lib/api"
import { Loader2, ArrowRight, CheckCircle2, Globe, ShieldCheck } from "lucide-react"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [domain, setDomain] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const cleanDomainInput = (raw: string) => {
    return raw
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/.*$/, "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const cleanedDomain = cleanDomainInput(domain)

    try {
      const { data, error: err } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
        callbackURL: "/analytics",
      })

      if (err) {
        setError(err.message || "Failed to create account. Please try again.")
        setLoading(false)
        return
      }

      if (data) {
        // Automatically create initial site if domain provided
        if (cleanedDomain) {
          try {
            await createSite(cleanedDomain)
          } catch (siteErr) {
            console.warn("Auto-site creation warning:", siteErr)
          }
          router.push(`/analytics?domain=${encodeURIComponent(cleanedDomain)}`)
        } else {
          router.push("/analytics")
        }
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.")
      setLoading(false)
    }
  }

  return (
    <div className={cn("min-h-screen w-full grid lg:grid-cols-2 bg-white", className)} {...props}>
      {/* LEFT SIDE: Signup Form */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-16 max-w-xl mx-auto w-full">
        {/* Brand Logo Header */}
        <div>
          <Link href="/" aria-label="UpFront Home" className="inline-block">
            <Image
              src="/logo/syft-logo-black.svg"
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
              Create your workspace
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Start with the Free plan today — unlimited websites, no credit card required.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-ink mb-1.5">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                autoComplete="name"
                className="h-11 rounded-lg border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-ink mb-1.5">
                Work Email
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
                <label htmlFor="domain" className="text-xs font-medium text-ink">
                  Website Domain
                </label>
                <span className="text-[11px] text-muted-foreground">e.g. yoursite.com</span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                </div>
                <Input
                  id="domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="acme-store.com"
                  required
                  autoComplete="url"
                  className="h-11 pl-10 pr-3.5 rounded-lg border-line bg-surface text-sm text-ink placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-ink mb-1.5">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
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
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-brand-dark transition-colors underline-offset-2 hover:underline"
            >
              Log in
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
            No credit card required
          </span>
          <span className="text-xs font-medium text-muted-foreground">Instant setup</span>
        </div>

        {/* Center Illustration */}
        <div className="relative z-10 my-auto flex flex-col items-center text-center px-4">
          <div className="relative w-full max-w-md h-72 sm:h-80 mb-6 drop-shadow-sm">
            <Image
              src="/illustrations/Sign up-pana.svg"
              alt="Sign Up Illustration"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-2xl font-medium tracking-normal text-ink max-w-md">
            Everything your website needs in one place.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-sm">
            Real-time traffic metrics, custom consent banner builder, cookie scanner, and proof-of-consent vault.
          </p>
        </div>

        {/* Feature Highlights Footer */}
        <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-line/60 pt-6">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <span>Unlimited sites</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <span>50,000 views free</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <span>Google Consent Mode</span>
          </div>
        </div>
      </div>
    </div>
  )
}
