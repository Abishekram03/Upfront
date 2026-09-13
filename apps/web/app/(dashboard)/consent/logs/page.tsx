import { ConsentLogs } from "@/components/dashboard/consent/consent-logs"

export const metadata = {
  title: "Proof of Consent Vault — Userly CMP",
  description: "Cryptographic receipt logs and one-click CSV audit export",
}

export default function ConsentLogsPage() {
  return <ConsentLogs />
}
