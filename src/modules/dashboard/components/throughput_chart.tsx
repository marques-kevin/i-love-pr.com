import { useIntl } from 'react-intl'
import { ThroughputChart as ThroughputChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './throughput_chart.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel title={intl.formatMessage({ id: 'chart.throughput.title' })}>
      <ThroughputChartView data={data} />
    </Panel>
  )
}

export const ThroughputChart = connector(Wrapper)
