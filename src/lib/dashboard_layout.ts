import type { DashboardLayoutItem, DashboardWidgetId } from '@/lib/types'

const VALID_WIDGET_IDS = new Set<DashboardWidgetId>([
  'summary_stats',
  'cycle_time',
  'throughput',
  'pr_size',
  'reviewer_load',
  'size_review_insight',
  'size_vs_review',
  'size_review_scatter',
  'open_prs',
])

/** Default layout matches the previous fixed dashboard. */
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutItem[] = [
  { instance_id: 'summary_stats', widget_id: 'summary_stats' },
  { instance_id: 'cycle_time', widget_id: 'cycle_time' },
  { instance_id: 'throughput', widget_id: 'throughput' },
  { instance_id: 'pr_size', widget_id: 'pr_size' },
  { instance_id: 'reviewer_load', widget_id: 'reviewer_load' },
  { instance_id: 'size_review_insight', widget_id: 'size_review_insight' },
  { instance_id: 'size_vs_review', widget_id: 'size_vs_review' },
  { instance_id: 'size_review_scatter', widget_id: 'size_review_scatter' },
  { instance_id: 'open_prs', widget_id: 'open_prs' },
]

/**
 * `undefined` → default layout (first load).
 * `[]` → intentionally empty custom dashboard.
 */
export function normalize_dashboard_layout(
  value: DashboardLayoutItem[] | null | undefined,
): DashboardLayoutItem[] {
  if (value == null) return DEFAULT_DASHBOARD_LAYOUT.map((item) => ({ ...item }))
  return value
    .filter(
      (item): item is DashboardLayoutItem =>
        Boolean(item?.instance_id) &&
        Boolean(item?.widget_id) &&
        VALID_WIDGET_IDS.has(item.widget_id),
    )
    .map((item) => ({
      instance_id: item.instance_id,
      widget_id: item.widget_id,
    }))
}

export function create_layout_item(widget_id: DashboardWidgetId): DashboardLayoutItem {
  return {
    instance_id: crypto.randomUUID(),
    widget_id,
  }
}
