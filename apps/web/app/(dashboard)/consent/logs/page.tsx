import { ConsentLedger } from "@/components/dashboard/consent/consent-ledger"

export const metadata = {
  title: "Proof of Consent Vault — ConsentOS CMP",
  description: "Cryptographic receipt logs and one-click CSV audit export",
}

export default function ConsentLogsPage() {
  return <ConsentLedger />
}

