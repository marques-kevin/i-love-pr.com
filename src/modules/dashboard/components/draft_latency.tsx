import { useIntl } from 'react-intl'
import { DraftLatencyChart as ChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './draft_latency.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.draft_latency.title' })}
      help={intl.formatMessage({ id: 'chart.draft_latency.help' })}
    >
      <ChartView data={data} />
    </Panel>
  )
}

export const DraftLatency = connector(Wrapper)
