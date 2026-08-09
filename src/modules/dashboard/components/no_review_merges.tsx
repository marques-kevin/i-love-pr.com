import { useIntl } from 'react-intl'
import { Panel, StatCard } from './panel'
import { connector, type ConnectorProps } from './no_review_merges.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null

  if (data.mergedCount === 0) {
    return (
      <Panel title={intl.formatMessage({ id: 'chart.no_review_merges.title' })}>
        <p className="text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'chart.no_review_merges.empty' })}
        </p>
      </Panel>
    )
  }

  const ratio = data.noReviewRatio == null ? '—' : `${Math.round(data.noReviewRatio * 1000) / 10}%`

  return (
    <Panel title={intl.formatMessage({ id: 'chart.no_review_merges.title' })}>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={intl.formatMessage({ id: 'chart.no_review_merges.count' })}
          value={String(data.noReviewCount)}
        />
        <StatCard
          label={intl.formatMessage({ id: 'chart.no_review_merges.ratio' })}
          value={ratio}
        />
      </div>
    </Panel>
  )
}

export const NoReviewMerges = connector(Wrapper)
