import { ConsentLogs } from "@/components/dashboard/consent/consent-logs"

export const metadata = {
  title: "Proof of Consent Vault — Userly CMP",
  description: "GDPR Article 7(1) compliant cryptographic receipt logs and CSV audit export",
}

export default function ConsentLogsPage() {
  return <ConsentLogs />
}
