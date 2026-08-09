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
  size_review_insight: 'widget.size_review_insight.label',
  size_vs_review: 'widget.size_vs_review.label',
  size_review_scatter: 'widget.size_review_scatter.label',
  open_prs: 'widget.open_prs.label',
} as const satisfies Record<DashboardWidgetId, MessageKey>

const WIDGET_DESCRIPTION_KEYS = {
  summary_stats: 'widget.summary_stats.description',
  cycle_time: 'widget.cycle_time.description',
  throughput: 'widget.throughput.description',
  pr_size: 'widget.pr_size.description',
  reviewer_load: 'widget.reviewer_load.description',
  size_review_insight: 'widget.size_review_insight.description',
  size_vs_review: 'widget.size_vs_review.description',
  size_review_scatter: 'widget.size_review_scatter.description',
  open_prs: 'widget.open_prs.description',
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

/** Keys covered by typed dynamic helpers — treated as used by the unused-key checker. */
export const DYNAMICALLY_REFERENCED_MESSAGE_KEYS: MessageKey[] = [
  ...Object.values(LOCALE_MESSAGE_KEYS),
  ...Object.values(PERIOD_MESSAGE_KEYS),
  ...Object.values(WIDGET_LABEL_KEYS),
  ...Object.values(WIDGET_DESCRIPTION_KEYS),
]
