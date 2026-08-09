import type { DashboardWidgetId } from '@/lib/types'
import { create_layout_item } from '@/lib/dashboard_layout'

export type WidgetSpan = 'full' | 'half'

export interface DashboardWidgetMeta {
  widget_id: DashboardWidgetId
  span: WidgetSpan
}

export const DASHBOARD_WIDGET_CATALOG: DashboardWidgetMeta[] = [
  { widget_id: 'summary_stats', span: 'full' },
  { widget_id: 'cycle_time', span: 'half' },
  { widget_id: 'cycle_breakdown', span: 'full' },
  { widget_id: 'cycle_percentiles', span: 'half' },
  { widget_id: 'review_latency', span: 'half' },
  { widget_id: 'throughput', span: 'half' },
  { widget_id: 'flow_volume', span: 'half' },
  { widget_id: 'pr_size', span: 'half' },
  { widget_id: 'review_rounds', span: 'half' },
  { widget_id: 'no_review_merges', span: 'half' },
  { widget_id: 'reviewer_load', span: 'half' },
  { widget_id: 'author_leaderboard', span: 'full' },
  { widget_id: 'size_vs_review', span: 'half' },
  { widget_id: 'size_review_cost', span: 'half' },
  { widget_id: 'size_review_scatter', span: 'half' },
  { widget_id: 'open_pr_age', span: 'half' },
  { widget_id: 'open_prs', span: 'full' },
]

export const DASHBOARD_WIDGET_BY_ID: Record<DashboardWidgetId, DashboardWidgetMeta> =
  Object.fromEntries(DASHBOARD_WIDGET_CATALOG.map((w) => [w.widget_id, w])) as Record<
    DashboardWidgetId,
    DashboardWidgetMeta
  >

export { create_layout_item }
