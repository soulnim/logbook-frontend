import { client } from './client'

export type InsightType =
  | 'WEEKLY_SUMMARY'
  | 'LEARNING_PATTERNS'
  | 'PRODUCTIVITY_CHECK'
  | 'COMMIT_DIGEST'
  | 'MOTIVATE_ME'

export interface InsightRequest {
  insightType: InsightType
  focusNote?: string
}

export interface InsightResponse {
  insightType: InsightType
  insight: string
  entryCount: number
  dateRange: string
  hasData: boolean
}

export const aiApi = {
  getInsight: (request: InsightRequest) =>
    client.post<InsightResponse>('/api/ai/insights', request).then(r => r.data),
}