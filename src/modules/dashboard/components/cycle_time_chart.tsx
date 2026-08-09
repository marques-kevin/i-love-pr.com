import { CycleTimeChart as CycleTimeChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './cycle_time_chart.connector'

export function Wrapper({ data }: ConnectorProps) {
  if (!data) return null
  return (
    <Panel title="Cycle time over time">
      <CycleTimeChartView data={data} />
    </Panel>
  )
}

export const CycleTimeChart = connector(Wrapper)
