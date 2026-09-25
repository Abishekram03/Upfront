import { ConsentConfig, ConsentStatsSummary, ScannerResponse } from "@/lib/api"

export interface CategoryItem {
  key: "necessary" | "functional" | "analytics" | "performance" | "advertisement"
  label: string
  description: string
  percentage: number
  required?: boolean
  badgeColor: string
  barColor: string
}

export interface HealthItem {
  id: string
  title: string
  description: string
  status: "success" | "warning" | "error" | "neutral"
  actionLabel?: string
  actionHref?: string
}

export interface ConsentOverviewState {
  config: ConsentConfig | null
  stats: ConsentStatsSummary | null
  scanner: ScannerResponse | null
  isLoading: boolean
  error: string | null
  isToggling: boolean
}
