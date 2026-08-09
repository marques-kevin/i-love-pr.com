import { PRSizeChart as PRSizeChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './pr_size_chart.connector'

export function Wrapper({ data }: ConnectorProps) {
  if (!data) return null
  return (
    <Panel title="PR size distribution">
      <PRSizeChartView data={data} />
    </Panel>
  )
}

export const PRSizeChart = connector(Wrapper)
