import { useIntl } from 'react-intl'
import { ReviewLatencyChart as ChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './review_latency.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel title={intl.formatMessage({ id: 'chart.review_latency.title' })}>
      <ChartView data={data} />
    </Panel>
  )
}

export const ReviewLatency = connector(Wrapper)
