import { useIntl } from 'react-intl'
import { SizeVsReviewTimeChart as SizeVsReviewTimeChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './size_vs_review_chart.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.size_vs_review.title' })}
      help={intl.formatMessage({ id: 'chart.size_vs_review.help' })}
    >
      <SizeVsReviewTimeChartView data={data} />
      <ul className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        {data.map((row) => (
          <li key={row.bucket}>
            <span className="font-medium text-foreground">{row.bucket}</span>
            {' · '}
            n={row.count}
            {row.avgHoursPerHundredLines != null && (
              <>
                {' · '}
                {row.avgHoursPerHundredLines.toFixed(1)}h approve / 100 lines
              </>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export const SizeVsReviewChart = connector(Wrapper)
