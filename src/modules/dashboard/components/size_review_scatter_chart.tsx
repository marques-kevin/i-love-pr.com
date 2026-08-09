import { useIntl } from 'react-intl'
import { SizeReviewScatterChart as SizeReviewScatterChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './size_review_scatter_chart.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.scatter.title' })}
      help={intl.formatMessage({ id: 'chart.scatter.help' })}
    >
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviewed PRs in this period/filter.</p>
      ) : (
        <SizeReviewScatterChartView data={data} />
      )}
    </Panel>
  )
}

export const SizeReviewScatterChart = connector(Wrapper)
