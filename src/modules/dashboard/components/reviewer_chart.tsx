import { useIntl } from 'react-intl'
import { ReviewerChart as ReviewerChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './reviewer_chart.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel title={intl.formatMessage({ id: 'chart.reviewer.title' })}>
      <ReviewerChartView data={data} />
    </Panel>
  )
}

export const ReviewerChart = connector(Wrapper)
