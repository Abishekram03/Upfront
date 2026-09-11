import { CookiePolicyGenerator } from "@/components/dashboard/consent/cookie-policy-generator"

export const metadata = {
  title: "Cookie Policy Generator — usrly CMP",
  description: "Generate and embed a GDPR & ePrivacy compliant cookie declaration page",
}

export default function CookiePolicyPage() {
  return <CookiePolicyGenerator />
}
