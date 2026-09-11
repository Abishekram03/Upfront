"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react"

export function TwoFactorForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [isBackup, setIsBackup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isBackup) {
        const { error: err } = await authClient.twoFactor.verifyBackupCode({
          code,
        })
        if (err) setError(err.message || "Invalid backup code.")
        else router.push("/analytics")
      } else {
        const { error: err } = await authClient.twoFactor.verifyTOTP({
          code,
        })
        if (err) setError(err.message || "Invalid authentication code.")
        else router.push("/analytics")
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during verification.")
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
                <div className="size-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-900 mb-1">
                  <ShieldCheck className="size-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                  Two-Factor Authentication
                </h1>
                <p className="text-balance text-sm text-neutral-500">
                  {isBackup
                    ? "Enter one of your emergency recovery backup codes"
                    : "Enter the 6-digit code from your authenticator app"}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="code" className="text-neutral-700">
                    {isBackup ? "Backup Code" : "Authentication Code"}
                  </FieldLabel>
                  <Input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.trim())}
                    placeholder={isBackup ? "e.g. 12345-67890" : "000000"}
                    autoFocus
                    required
                    className="bg-white border-neutral-200 text-neutral-900 text-center tracking-widest text-lg font-mono placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                  />
                </Field>

                <Field>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : "Verify & Continue"}
                  </Button>
                </Field>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsBackup(!isBackup); setCode(""); setError(""); }}
                    className="text-neutral-600 hover:text-neutral-900 font-medium underline underline-offset-2"
                  >
                    {isBackup ? "Use Authenticator App" : "Use a backup recovery code"}
                  </button>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-800"
                  >
                    <ArrowLeft className="size-3" /> Back
                  </Link>
                </div>
              </form>
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
                "Multi-factor authentication protects your analytics and domain settings."
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
