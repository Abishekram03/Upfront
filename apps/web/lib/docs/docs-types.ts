import { LucideIcon } from "lucide-react"

export interface DocHeading {
  id: string
  title: string
  level: 2 | 3
}

export interface DocArticleMeta {
  id: string
  title: string
  category: string
  categoryId: string
  description: string
  badge?: string
  readTime?: string
  lastUpdated?: string
}

export interface DocCategory {
  id: string
  title: string
  iconName: string
  description: string
  articles: DocArticleMeta[]
}

export interface DocFeedbackState {
  articleId: string
  helpful: boolean | null
  submitted: boolean
  comment?: string
}
