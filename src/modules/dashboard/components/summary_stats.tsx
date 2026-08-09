import { useIntl } from 'react-intl'
import { StatCard } from './panel'
import { connector, type ConnectorProps } from './summary_stats.connector'

function format_hours(h: number | null): string {
  if (h == null) return '—'
  if (h < 24) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

export function Wrapper({ summary, business_hours_enabled }: ConnectorProps) {
  const intl = useIntl()
  if (!summary) return null

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label={intl.formatMessage({ id: 'stats.merged' })}
        value={String(summary.mergedCount)}
      />
      <StatCard
        label={intl.formatMessage({
          id: business_hours_enabled ? 'stats.cycle_time_biz' : 'stats.cycle_time',
        })}
        value={format_hours(summary.avgCycleTimeHours)}
      />
      <StatCard
        label={intl.formatMessage({
          id: business_hours_enabled ? 'stats.tfr_biz' : 'stats.tfr',
        })}
        value={format_hours(summary.avgTimeToFirstReviewHours)}
      />
      <StatCard
        label={intl.formatMessage({
          id: business_hours_enabled ? 'stats.approve_biz' : 'stats.approve',
        })}
        value={format_hours(summary.avgTimeToApproveHours)}
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
      />
    </section>
  )
}

export const SummaryStats = connector(Wrapper)
