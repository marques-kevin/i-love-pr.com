import type { DashboardWidgetId } from '@/lib/types'
import { create_layout_item } from '@/lib/dashboard_layout'

export type WidgetSpan = 'full' | 'half'

export interface DashboardWidgetMeta {
  widget_id: DashboardWidgetId
  label: string
  description: string
  span: WidgetSpan
}

export const DASHBOARD_WIDGET_CATALOG: DashboardWidgetMeta[] = [
  {
    widget_id: 'summary_stats',
    label: 'Summary stats',
    description: 'Merged count, cycle time, review latency, and average PR size.',
    span: 'full',
  },
  {
    widget_id: 'cycle_time',
    label: 'Cycle time',
    description: 'Average cycle time by week.',
    span: 'half',
  },
  {
    widget_id: 'throughput',
    label: 'Throughput',
    description: 'Merged PRs per week by author.',
    span: 'half',
  },
  {
    widget_id: 'pr_size',
    label: 'PR size',
    description: 'Distribution of PR sizes (XS–XL).',
    span: 'half',
  },
  {
    widget_id: 'reviewer_load',
    label: 'Reviewer load',
    description: 'Reviews given vs received per person.',
    span: 'half',
  },
  {
    widget_id: 'size_review_insight',
    label: 'Size vs review insight',
    description: 'Correlation between PR size and review time.',
    span: 'full',
  },
  {
    widget_id: 'size_vs_review',
    label: 'Size vs review time',
    description: 'Average review time by PR size bucket.',
    span: 'half',
  },
  {
    widget_id: 'size_review_scatter',
    label: 'Size vs approve scatter',
    description: 'Lines changed vs request → approve.',
    span: 'half',
  },
  {
    widget_id: 'open_prs',
    label: 'Open PRs',
    description: 'Currently open pull requests with stale signals.',
    span: 'full',
  },
]

export const DASHBOARD_WIDGET_BY_ID: Record<DashboardWidgetId, DashboardWidgetMeta> =
  Object.fromEntries(DASHBOARD_WIDGET_CATALOG.map((w) => [w.widget_id, w])) as Record<
    DashboardWidgetId,
    DashboardWidgetMeta
  >

export { create_layout_item }
