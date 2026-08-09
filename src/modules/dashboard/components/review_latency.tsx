import { useIntl } from 'react-intl'
import { ReviewLatencyChart as ReviewLatencyChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './review_latency.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.review_latency.title' })}
      help={intl.formatMessage({ id: 'chart.review_latency.help' })}
    >
      <ReviewLatencyChartView data={data} />
    </Panel>
  )
}

export const ReviewLatency = connector(Wrapper)
