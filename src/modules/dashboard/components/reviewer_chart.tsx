import { ReviewerChart as ReviewerChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './reviewer_chart.connector'

export function Wrapper({ data }: ConnectorProps) {
  if (!data) return null
  return (
    <Panel title="Review load">
      <ReviewerChartView data={data} />
    </Panel>
  )
}

export const ReviewerChart = connector(Wrapper)
