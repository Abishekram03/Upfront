import { ResetPasswordForm } from "@/components/reset-password-form"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-neutral-100/70 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <ResetPasswordForm token={params.token} />
      </div>
    </div>
  )
}
