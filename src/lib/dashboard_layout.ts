import type { DashboardLayoutItem, DashboardTab, DashboardWidgetId, PeriodKey } from '@/lib/types'

const VALID_WIDGET_IDS = new Set<DashboardWidgetId>([
  'summary_stats',
  'cycle_time',
  'throughput',
  'pr_size',
  'reviewer_load',
  'size_vs_review',
  'size_review_cost',
  'size_review_scatter',
  'open_prs',
  'cycle_breakdown',
  'review_latency',
  'cycle_percentiles',
  'review_rounds',
  'no_review_merges',
  'author_leaderboard',
  'open_pr_age',
  'flow_volume',
  'draft_latency',
  'lead_vs_cycle',
  'repo_comparison',
  'author_cycle_ranking',
  'review_balance',
  'review_state_mix',
  'additions_deletions',
  'rounds_vs_size',
])

const VALID_PERIOD_KEYS = new Set<PeriodKey>(['7d', '30d', '90d', 'custom'])

export const DEFAULT_DASHBOARD_ID = 'default'

/** Default layout matches the previous fixed dashboard. */
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutItem[] = [
  { instance_id: 'summary_stats', widget_id: 'summary_stats' },
  { instance_id: 'cycle_time', widget_id: 'cycle_time' },
  { instance_id: 'throughput', widget_id: 'throughput' },
  { instance_id: 'pr_size', widget_id: 'pr_size' },
  { instance_id: 'reviewer_load', widget_id: 'reviewer_load' },
  { instance_id: 'size_vs_review', widget_id: 'size_vs_review' },
  { instance_id: 'size_review_cost', widget_id: 'size_review_cost' },
  { instance_id: 'size_review_scatter', widget_id: 'size_review_scatter' },
  { instance_id: 'open_prs', widget_id: 'open_prs' },
]

export type DashboardTabFilters = {
  members: string[]
  period_key: PeriodKey
  custom_from: string
  custom_to: string
  hide_test_files: boolean
}

export function default_dashboard_filters(): DashboardTabFilters {
  return {
    members: [],
    period_key: '30d',
    custom_from: '',
    custom_to: '',
    hide_test_files: false,
  }
}

export function normalize_period_key(value: unknown): PeriodKey {
  if (typeof value === 'string' && VALID_PERIOD_KEYS.has(value as PeriodKey)) {
    return value as PeriodKey
  }
  return '30d'
}

export function normalize_dashboard_filters(
  value: Partial<DashboardTabFilters> | null | undefined,
): DashboardTabFilters {
  const defaults = default_dashboard_filters()
  if (!value) return defaults
  return {
    members: Array.isArray(value.members)
      ? value.members.filter(
          (member): member is string => typeof member === 'string' && member.length > 0,
        )
      : defaults.members,
    period_key: normalize_period_key(value.period_key),
    custom_from: typeof value.custom_from === 'string' ? value.custom_from : defaults.custom_from,
    custom_to: typeof value.custom_to === 'string' ? value.custom_to : defaults.custom_to,
    hide_test_files:
      typeof value.hide_test_files === 'boolean' ? value.hide_test_files : defaults.hide_test_files,
  }
}

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

export function create_default_dashboard(layout?: DashboardLayoutItem[] | null): DashboardTab {
  return {
    id: DEFAULT_DASHBOARD_ID,
    name: '',
    layout: normalize_dashboard_layout(layout),
    ...default_dashboard_filters(),
  }
}

export function create_dashboard_tab(name: string): DashboardTab {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    layout: [],
    ...default_dashboard_filters(),
  }
}

function normalize_dashboard_tab(tab: DashboardTab): DashboardTab | null {
  if (!tab?.id) return null
  return {
    id: String(tab.id),
    name: typeof tab.name === 'string' ? tab.name.trim() : '',
    layout: normalize_dashboard_layout(tab.layout ?? []),
    ...normalize_dashboard_filters(tab),
  }
}

/**
 * Prefer `dashboards` when present.
 * Otherwise migrate legacy `dashboard_layout` into a single default tab.
 */
export function normalize_dashboards(
  dashboards: DashboardTab[] | null | undefined,
  legacy_layout?: DashboardLayoutItem[] | null,
): DashboardTab[] {
  if (Array.isArray(dashboards) && dashboards.length > 0) {
    const normalized = dashboards
      .map(normalize_dashboard_tab)
      .filter((tab): tab is DashboardTab => tab != null)
    if (normalized.length > 0) return normalized
  }
  return [create_default_dashboard(legacy_layout)]
}

export function normalize_active_dashboard_id(
  active_id: string | null | undefined,
  dashboards: DashboardTab[],
): string {
  if (active_id && dashboards.some((tab) => tab.id === active_id)) return active_id
  return dashboards[0]?.id ?? DEFAULT_DASHBOARD_ID
}

export function get_active_dashboard(dashboards: DashboardTab[], active_id: string): DashboardTab {
  return (
    dashboards.find((tab) => tab.id === active_id) ?? dashboards[0] ?? create_default_dashboard()
  )
}

/** Settings row may still carry legacy `dashboard_layout` from older IndexedDB writes. */
export type SettingsDashboardsInput = {
  dashboards?: DashboardTab[] | null
  active_dashboard_id?: string | null
  dashboard_layout?: DashboardLayoutItem[] | null
}

export function normalize_settings_dashboards(input: SettingsDashboardsInput): {
  dashboards: DashboardTab[]
  active_dashboard_id: string
} {
  const dashboards = normalize_dashboards(input.dashboards, input.dashboard_layout)
  return {
    dashboards,
    active_dashboard_id: normalize_active_dashboard_id(input.active_dashboard_id, dashboards),
  }
}
