import { PolicyDashboardView } from "@/components/dashboard/policy/policy-dashboard-view"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Legal Policies & Compliance Suite — CMP",
  description: "Generate, customize, and publish industry-standard Privacy Policy, Cookie Policy, Terms of Service, and compliance documents for your website.",
}

export default function ConsentPolicyPage() {
  return <PolicyDashboardView />
}


