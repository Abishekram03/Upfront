"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { CheckCircle2, Loader2 } from "lucide-react"

export function ResetPasswordForm({
  token,
  className,
  ...props
}: { token?: string } & React.ComponentProps<"div">) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const { error: err } = await authClient.resetPassword({
        newPassword: password,
        token: token || "",
      })

      if (err) {
        setError(err.message || "Failed to reset password. The link may have expired.")
      } else {
        setSuccess(true)
        setTimeout(() => router.push("/login"), 2000)
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
                  Set new password
                </h1>
                <p className="text-balance text-sm text-neutral-500">
                  Please enter your new password below
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
                  {error}
                </div>
              )}

              {success ? (
                <div className="py-6 flex flex-col items-center text-center space-y-3">
                  <CheckCircle2 className="size-10 text-emerald-500" />
                  <h3 className="text-base font-semibold text-neutral-900">Password Updated!</h3>
                  <p className="text-xs text-neutral-500">
                    Your password has been changed. Redirecting to login...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field>
                    <FieldLabel htmlFor="password" className="text-neutral-700">New Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white border-neutral-200 text-neutral-900"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmPassword" className="text-neutral-700">Confirm Password</FieldLabel>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-white border-neutral-200 text-neutral-900"
                    />
                  </Field>
                  <Field>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium"
                    >
                      {loading ? <Loader2 className="size-4 animate-spin" /> : "Update Password"}
                    </Button>
                  </Field>
                </form>
              )}
            </FieldGroup>
          </div>

          <div className="relative hidden bg-neutral-50 p-8 md:flex flex-col justify-between border-l border-neutral-200">
            <div className="flex items-center gap-2">
              <Image
                src="/UpFront-Logo-Blue-600.svg"
                alt="UpFront Logo"
                width={130}
                height={36}
                className="h-8 w-auto object-contain"
                priority
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-900 leading-snug">
                "Simple analytics + integrated consent management in one lightweight script."
              </p>
              <p className="text-xs text-neutral-500">
                A product by Syft Technologies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
