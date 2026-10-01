import { ConsentLedger } from "@/components/dashboard/consent/consent-ledger"

export const metadata = {
  title: "Consent Logs — Upfront",
  description: "Cryptographically verified consent records and regulatory audit trail.",
}

export default function ConsentLogsPage() {
  return <ConsentLedger />
}
