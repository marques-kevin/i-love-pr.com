import { useIntl } from 'react-intl'
import { format_hours } from '@/lib/format_hours'
import { StatCard } from './panel'
import { connector, type ConnectorProps } from './summary_stats.connector'

export function Wrapper({ summary, business_hours_enabled }: ConnectorProps) {
  const intl = useIntl()
  if (!summary) return null

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label={intl.formatMessage({ id: 'stats.merged' })}
        value={String(summary.mergedCount)}
        help={intl.formatMessage({ id: 'stats.merged.help' })}
      />
      <StatCard
        label={intl.formatMessage({
          id: business_hours_enabled ? 'stats.cycle_time_biz' : 'stats.cycle_time',
        })}
        value={format_hours(summary.avgCycleTimeHours)}
        help={intl.formatMessage({
          id: business_hours_enabled ? 'stats.cycle_time_biz.help' : 'stats.cycle_time.help',
        })}
      />
      <StatCard
        label={intl.formatMessage({
          id: business_hours_enabled ? 'stats.tfr_biz' : 'stats.tfr',
        })}
        value={format_hours(summary.avgTimeToFirstReviewHours)}
        help={intl.formatMessage({
          id: business_hours_enabled ? 'stats.tfr_biz.help' : 'stats.tfr.help',
        })}
      />
      <StatCard
        label={intl.formatMessage({
          id: business_hours_enabled ? 'stats.approve_biz' : 'stats.approve',
        })}
        value={format_hours(summary.avgTimeToApproveHours)}
        help={intl.formatMessage({
          id: business_hours_enabled ? 'stats.approve_biz.help' : 'stats.approve.help',
        })}
      />
      <StatCard
        label={intl.formatMessage({ id: 'stats.avg_size' })}
        value={
          summary.avgLinesChanged != null
            ? intl.formatMessage(
                { id: 'stats.lines' },
                { count: Math.round(summary.avgLinesChanged) },
              )
            : '—'
        }
        help={intl.formatMessage({ id: 'stats.avg_size.help' })}
      />
    </section>
  )
}

export const SummaryStats = connector(Wrapper)
