import { CookiePolicyGenerator } from "@/components/dashboard/consent/cookie-policy-generator"

export const metadata = {
  title: "Cookie Policy Generator — Upfront",
  description: "Generate and embed a clean, transparent cookie declaration policy for your website",
}

export default function CookiePolicyPage() {
  return <CookiePolicyGenerator />
}

