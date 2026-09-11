"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error: err } = await (authClient as any).forgetPassword({
        email,
        redirectTo: "/reset-password",
      })

      if (err) {
        setError(err.message || "Failed to send reset email. Please try again.")
      } else {
        setSubmitted(true)
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-neutral-200 shadow-sm bg-white">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                  Reset your password
                </h1>
                <p className="text-balance text-sm text-neutral-500">
                  Enter your email address and we&apos;ll send you a password reset link
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
                  {error}
                </div>
              )}

              {submitted ? (
                <div className="py-6 flex flex-col items-center text-center space-y-3">
                  <CheckCircle2 className="size-10 text-emerald-500" />
                  <h3 className="text-base font-semibold text-neutral-900">Check your inbox</h3>
                  <p className="text-xs text-neutral-500 max-w-xs">
                    We have sent a password reset link to <strong className="text-neutral-800">{email}</strong>.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 pt-2 hover:underline"
                  >
                    <ArrowLeft className="size-3.5" /> Back to login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field>
                    <FieldLabel htmlFor="email" className="text-neutral-700">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="m@example.com"
                      required
                      className="bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400"
                    />
                  </Field>
                  <Field>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium"
                    >
                      {loading ? <Loader2 className="size-4 animate-spin" /> : "Send Reset Link"}
                    </Button>
                  </Field>
                  <FieldDescription className="text-center text-xs text-neutral-500">
                    Remember your password?{" "}
                    <Link href="/login" className="text-neutral-900 font-medium underline underline-offset-2 hover:text-neutral-700">
                      Login
                    </Link>
                  </FieldDescription>
                </form>
              )}
            </FieldGroup>
          </div>

          <div className="relative hidden bg-neutral-50 p-8 md:flex flex-col justify-between border-l border-neutral-200">
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-ojuju)] text-3xl font-[800] tracking-tight text-neutral-900">
                Userly
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-900 leading-snug">
                "Security and privacy at the core of everything we build."
              </p>
              <p className="text-xs text-neutral-500">
                Account security protected by modern encryption and MFA.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
