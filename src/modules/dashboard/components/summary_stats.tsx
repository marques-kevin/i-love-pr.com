import { StatCard } from './panel'
import { connector, type ConnectorProps } from './summary_stats.connector'

function format_hours(h: number | null): string {
  if (h == null) return '—'
  if (h < 24) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

export function Wrapper({ summary, business_hours_enabled }: ConnectorProps) {
  if (!summary) return null

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Merged PRs" value={String(summary.mergedCount)} />
      <StatCard
        label={business_hours_enabled ? 'Avg cycle time (biz)' : 'Avg cycle time'}
        value={format_hours(summary.avgCycleTimeHours)}
      />
      <StatCard
        label={business_hours_enabled ? 'Time to first review (biz)' : 'Time to first review'}
        value={format_hours(summary.avgTimeToFirstReviewHours)}
      />
      <StatCard
        label={business_hours_enabled ? 'Request → approve (biz)' : 'Request → approve'}
        value={format_hours(summary.avgTimeToApproveHours)}
      />
      <StatCard
        label="Avg PR size"
        value={
          summary.avgLinesChanged != null ? `${Math.round(summary.avgLinesChanged)} lines` : '—'
        }
      />
    </section>
  )
}

export const SummaryStats = connector(Wrapper)
