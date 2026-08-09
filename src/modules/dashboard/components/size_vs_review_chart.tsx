import { useIntl } from 'react-intl'
import { SizeVsReviewTimeChart as SizeVsReviewTimeChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './size_vs_review_chart.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.size_vs_review.title' })}
      help={intl.formatMessage({ id: 'chart.size_vs_review.help' })}
    >
      <SizeVsReviewTimeChartView data={data} />
    </Panel>
  )
}

export const SizeVsReviewChart = connector(Wrapper)
