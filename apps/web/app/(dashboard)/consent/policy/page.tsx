import { PolicyGenerator } from "@/components/dashboard/consent/policy-generator"

export const metadata = {
  title: "Cookie Policy Generator — ConsentOS CMP",
  description: "Generate and embed a clean, transparent cookie declaration policy for your website",
}

export default function CookiePolicyPage() {
  return <PolicyGenerator />
}

