import type { AppLocale } from './locale'
import type { MessageKey } from './messages/en'
import type { DashboardWidgetId, PeriodKey } from '@/lib/types'

const LOCALE_MESSAGE_KEYS = {
  en: 'app.locale.en',
  fr: 'app.locale.fr',
} as const satisfies Record<AppLocale, MessageKey>

const PERIOD_MESSAGE_KEYS = {
  '7d': 'period.7d',
  '30d': 'period.30d',
  '90d': 'period.90d',
  custom: 'period.custom',
} as const satisfies Record<PeriodKey, MessageKey>

const WIDGET_LABEL_KEYS = {
  summary_stats: 'widget.summary_stats.label',
  cycle_time: 'widget.cycle_time.label',
  throughput: 'widget.throughput.label',
  pr_size: 'widget.pr_size.label',
  reviewer_load: 'widget.reviewer_load.label',
  size_vs_review: 'widget.size_vs_review.label',
  size_review_cost: 'widget.size_review_cost.label',
  size_review_scatter: 'widget.size_review_scatter.label',
  open_prs: 'widget.open_prs.label',
  cycle_breakdown: 'widget.cycle_breakdown.label',
  review_latency: 'widget.review_latency.label',
  cycle_percentiles: 'widget.cycle_percentiles.label',
  review_rounds: 'widget.review_rounds.label',
  no_review_merges: 'widget.no_review_merges.label',
  author_leaderboard: 'widget.author_leaderboard.label',
  open_pr_age: 'widget.open_pr_age.label',
  flow_volume: 'widget.flow_volume.label',
  draft_latency: 'widget.draft_latency.label',
  lead_vs_cycle: 'widget.lead_vs_cycle.label',
  repo_comparison: 'widget.repo_comparison.label',
  author_cycle_ranking: 'widget.author_cycle_ranking.label',
  review_balance: 'widget.review_balance.label',
  review_state_mix: 'widget.review_state_mix.label',
  additions_deletions: 'widget.additions_deletions.label',
  rounds_vs_size: 'widget.rounds_vs_size.label',
} as const satisfies Record<DashboardWidgetId, MessageKey>

const WIDGET_DESCRIPTION_KEYS = {
  summary_stats: 'widget.summary_stats.description',
  cycle_time: 'widget.cycle_time.description',
  throughput: 'widget.throughput.description',
  pr_size: 'widget.pr_size.description',
  reviewer_load: 'widget.reviewer_load.description',
  size_vs_review: 'widget.size_vs_review.description',
  size_review_cost: 'widget.size_review_cost.description',
  size_review_scatter: 'widget.size_review_scatter.description',
  open_prs: 'widget.open_prs.description',
  cycle_breakdown: 'widget.cycle_breakdown.description',
  review_latency: 'widget.review_latency.description',
  cycle_percentiles: 'widget.cycle_percentiles.description',
  review_rounds: 'widget.review_rounds.description',
  no_review_merges: 'widget.no_review_merges.description',
  author_leaderboard: 'widget.author_leaderboard.description',
  open_pr_age: 'widget.open_pr_age.description',
  flow_volume: 'widget.flow_volume.description',
  draft_latency: 'widget.draft_latency.description',
  lead_vs_cycle: 'widget.lead_vs_cycle.description',
  repo_comparison: 'widget.repo_comparison.description',
  author_cycle_ranking: 'widget.author_cycle_ranking.description',
  review_balance: 'widget.review_balance.description',
  review_state_mix: 'widget.review_state_mix.description',
  additions_deletions: 'widget.additions_deletions.description',
  rounds_vs_size: 'widget.rounds_vs_size.description',
} as const satisfies Record<DashboardWidgetId, MessageKey>

export function locale_message_key(locale: AppLocale): MessageKey {
  return LOCALE_MESSAGE_KEYS[locale]
}

export function period_message_key(period: PeriodKey): MessageKey {
  return PERIOD_MESSAGE_KEYS[period]
}

export function widget_label_key(widget_id: DashboardWidgetId): MessageKey {
  return WIDGET_LABEL_KEYS[widget_id]
}

export function widget_description_key(widget_id: DashboardWidgetId): MessageKey {
  return WIDGET_DESCRIPTION_KEYS[widget_id]
}

export function onboarding_scope_message_key(scope: string): MessageKey {
  if (scope === 'public_repo') return 'onboarding.scope.public_repo'
  if (scope === 'repo') return 'onboarding.scope.repo'
  return 'onboarding.scope.read_user'
}

/** Keys covered by typed dynamic helpers — treated as used by the unused-key checker. */
export const DYNAMICALLY_REFERENCED_MESSAGE_KEYS: MessageKey[] = [
  ...Object.values(LOCALE_MESSAGE_KEYS),
  ...Object.values(PERIOD_MESSAGE_KEYS),
  ...Object.values(WIDGET_LABEL_KEYS),
  ...Object.values(WIDGET_DESCRIPTION_KEYS),
  'onboarding.step.token_title',
  'onboarding.step.token_description',
  'onboarding.scope.public_repo',
  'onboarding.scope.repo',
  'onboarding.scope.read_user',
  'onboarding.hero.pill.local',
  'onboarding.hero.pill.nobackend',
  'onboarding.hero.pill.token',
  'onboarding.hero.pill.pwa',
  'onboarding.hero.pill.opensource',
  'onboarding.hero.grid.cycle_time',
  'onboarding.hero.grid.reviews',
  'onboarding.hero.grid.dashboard',
  'onboarding.hero.grid.sync',
  'onboarding.hero.grid.search',
  'onboarding.hero.grid.ship',
  'onboarding.hero.grid.history',
  'onboarding.hero.grid.insights',
  'sync.coverage.oldest',
  'sync.coverage.oldest_remote',
]
