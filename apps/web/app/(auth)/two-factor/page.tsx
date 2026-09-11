import { TwoFactorForm } from "@/components/two-factor-form"

export default function TwoFactorPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-neutral-100/70 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <TwoFactorForm />
      </div>
    </div>
  )
}
