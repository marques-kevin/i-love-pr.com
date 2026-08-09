import { ThroughputChart as ThroughputChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './throughput_chart.connector'

export function Wrapper({ data }: ConnectorProps) {
  if (!data) return null
  return (
    <Panel title="Throughput (merged / week)">
      <ThroughputChartView data={data} />
    </Panel>
  )
}

export const ThroughputChart = connector(Wrapper)
