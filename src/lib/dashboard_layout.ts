import type { DashboardLayoutItem, DashboardTab, DashboardWidgetId, PeriodKey } from '@/lib/types'
import type { JsonArray, JsonValue } from '@/lib/json_value'
import {
  is_json_object,
  is_string_value,
  json_string_array,
  json_string_field,
  optional_json_string,
} from '@/lib/boundary_parse'

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

export function normalize_period_key(value: JsonValue | null | undefined): PeriodKey {
  if (is_string_value(value ?? null)) {
    for (const key of VALID_PERIOD_KEYS) {
      if (key === value) return key
    }
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
      ? value.members.filter((member) => member.length > 0)
      : defaults.members,
    period_key: normalize_period_key(value.period_key ?? null),
    custom_from: value.custom_from ?? defaults.custom_from,
    custom_to: value.custom_to ?? defaults.custom_to,
    hide_test_files: value.hide_test_files ?? defaults.hide_test_files,
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

export function default_dashboard_id_for_repo(repo_full_name: string): string {
  return repo_full_name ? `default:${repo_full_name}` : DEFAULT_DASHBOARD_ID
}

export function create_default_dashboard(
  repo_full_name: string,
  layout?: DashboardLayoutItem[] | null,
): DashboardTab {
  return {
    id: default_dashboard_id_for_repo(repo_full_name),
    name: '',
    repo_full_name,
    layout: normalize_dashboard_layout(layout),
    ...default_dashboard_filters(),
  }
}

export function create_dashboard_tab(name: string, repo_full_name: string): DashboardTab {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    repo_full_name,
    layout: [],
    ...default_dashboard_filters(),
  }
}

function parse_widget_id(value: JsonValue | undefined): DashboardWidgetId | null {
  if (!is_string_value(value ?? null)) return null
  for (const widget_id of VALID_WIDGET_IDS) {
    if (widget_id === value) return widget_id
  }
  return null
}

function parse_layout_items_from_json(value: JsonArray): DashboardLayoutItem[] {
  const items: DashboardLayoutItem[] = []
  for (const item of value) {
    if (!is_json_object(item)) continue
    const instance_id = json_string_field(item, 'instance_id', 'instanceId')
    const widget_id = parse_widget_id(item.widget_id ?? item.widgetId)
    if (!instance_id || !widget_id) continue
    items.push({ instance_id, widget_id })
  }
  return items
}

export function parse_dashboard_layout_from_json(
  value: JsonValue | undefined,
): DashboardLayoutItem[] | undefined {
  if (!Array.isArray(value)) return undefined
  return normalize_dashboard_layout(parse_layout_items_from_json(value))
}

export function parse_dashboard_tabs_from_json(
  value: JsonValue | undefined,
): DashboardTab[] | undefined {
  if (!Array.isArray(value)) return undefined
  const tabs: DashboardTab[] = []
  for (const item of value) {
    if (!is_json_object(item)) continue
    const id = item.id
    if (!is_string_value(id) || id.length === 0) continue
    const layout_raw = item.layout
    const layout = Array.isArray(layout_raw)
      ? normalize_dashboard_layout(parse_layout_items_from_json(layout_raw))
      : normalize_dashboard_layout([])
    tabs.push({
      id,
      name: is_string_value(item.name) ? item.name.trim() : '',
      repo_full_name: json_string_field(item, 'repo_full_name', 'repoFullName'),
      layout,
      ...normalize_dashboard_filters({
        members: Array.isArray(item.members) ? json_string_array(item.members) : undefined,
        period_key: normalize_period_key(item.period_key ?? null),
        custom_from: optional_json_string(item.custom_from),
        custom_to: optional_json_string(item.custom_to),
        hide_test_files:
          item.hide_test_files === true || item.hide_test_files === false
            ? item.hide_test_files
            : undefined,
      }),
    })
  }
  return tabs.length > 0 ? tabs : undefined
}

function normalize_dashboard_tab(tab: DashboardTab, fallback_repo: string): DashboardTab | null {
  if (!tab?.id) return null
  const repo_full_name =
    is_string_value(tab.repo_full_name) && tab.repo_full_name.trim()
      ? tab.repo_full_name.trim()
      : fallback_repo
  return {
    id: String(tab.id),
    name: is_string_value(tab.name) ? tab.name.trim() : '',
    repo_full_name,
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
  fallback_repo = '',
): DashboardTab[] {
  if (Array.isArray(dashboards) && dashboards.length > 0) {
    const normalized = dashboards
      .map((tab) => normalize_dashboard_tab(tab, fallback_repo))
      .filter((tab): tab is DashboardTab => tab != null)
    if (normalized.length > 0) return normalized
  }
  return [create_default_dashboard(fallback_repo, legacy_layout)]
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
    dashboards.find((tab) => tab.id === active_id) ?? dashboards[0] ?? create_default_dashboard('')
  )
}

export function dashboards_for_repo(
  dashboards: DashboardTab[],
  repo_full_name: string | null,
): DashboardTab[] {
  if (!repo_full_name) return []
  return dashboards.filter((tab) => tab.repo_full_name === repo_full_name)
}

export function normalize_active_repo(
  active_repo: string | null | undefined,
  repos: string[],
): string | null {
  if (active_repo && repos.includes(active_repo)) return active_repo
  return repos[0] ?? null
}

export function normalize_active_dashboard_by_repo(
  value: Record<string, string> | null | undefined,
  repos: string[],
  dashboards: DashboardTab[],
  active_dashboard_id: string,
  active_repo: string | null,
) {
  const entries = repos.map((repo) => {
    const repo_tabs = dashboards_for_repo(dashboards, repo)
    const preferred =
      (value && is_string_value(value[repo]) ? value[repo] : null) ??
      (repo === active_repo ? active_dashboard_id : null)
    return [repo, normalize_active_dashboard_id(preferred, repo_tabs)] as const
  })
  return Object.fromEntries(entries)
}

/** Ensure every configured repo has at least one dashboard tab. */
export function ensure_dashboards_for_repos(
  dashboards: DashboardTab[],
  repos: string[],
): DashboardTab[] {
  const next = [...dashboards]
  for (const repo of repos) {
    if (next.some((tab) => tab.repo_full_name === repo)) continue
    next.push(create_default_dashboard(repo))
  }
  return next
}

/** Settings row may still carry legacy `dashboard_layout` from older IndexedDB writes. */
export type SettingsDashboardsInput = {
  repos?: string[] | null
  active_repo?: string | null
  dashboards?: DashboardTab[] | null
  active_dashboard_id?: string | null
  active_dashboard_by_repo?: Record<string, string> | null
  dashboard_layout?: DashboardLayoutItem[] | null
}

export function normalize_settings_dashboards(input: SettingsDashboardsInput) {
  const repos = Array.isArray(input.repos)
    ? input.repos.filter((repo) => is_string_value(repo) && repo.length > 0)
    : []
  const active_repo = normalize_active_repo(input.active_repo, repos)
  const fallback_repo = active_repo ?? repos[0] ?? ''
  let dashboards = normalize_dashboards(input.dashboards, input.dashboard_layout, fallback_repo)
  dashboards = ensure_dashboards_for_repos(dashboards, repos)

  const repo_tabs = dashboards_for_repo(dashboards, active_repo)
  const active_dashboard_id = normalize_active_dashboard_id(
    input.active_dashboard_id ??
      (active_repo && input.active_dashboard_by_repo
        ? input.active_dashboard_by_repo[active_repo]
        : null),
    repo_tabs.length > 0 ? repo_tabs : dashboards,
  )
  const active_dashboard_by_repo = normalize_active_dashboard_by_repo(
    input.active_dashboard_by_repo,
    repos,
    dashboards,
    active_dashboard_id,
    active_repo,
  )

  return {
    dashboards,
    active_dashboard_id:
      active_repo && active_dashboard_by_repo[active_repo]
        ? active_dashboard_by_repo[active_repo]
        : active_dashboard_id,
    active_repo,
    active_dashboard_by_repo,
  }
}
