import { useIntl } from 'react-intl'
import { SizeVsReviewCostChart as SizeVsReviewCostChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './size_review_cost_chart.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.size_review_cost.title' })}
      help={intl.formatMessage({ id: 'chart.size_review_cost.help' })}
    >
      <SizeVsReviewCostChartView data={data} />
    </Panel>
  )
}

export const SizeReviewCostChart = connector(Wrapper)
