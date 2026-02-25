import { client } from './client'
import type { HeatmapData, StatsData } from '../types'

export const statsApi = {
  getHeatmap: (start?: string, end?: string) =>
    client.get<HeatmapData>('/api/stats/heatmap', {
      params: { ...(start && { start }), ...(end && { end }) },
    }).then(r => r.data),

  getStats: () =>
    client.get<StatsData>('/api/stats').then(r => r.data),
}