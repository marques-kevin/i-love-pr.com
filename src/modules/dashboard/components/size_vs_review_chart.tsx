import { useIntl } from 'react-intl'
import {
  SizeVsReviewCostChart as SizeVsReviewCostChartView,
  SizeVsReviewTimeChart as SizeVsReviewTimeChartView,
} from './charts'
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
      <div className="grid gap-6 lg:grid-cols-2">
        <SizeVsReviewTimeChartView data={data} />
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {intl.formatMessage({ id: 'chart.size_vs_review.cost_title' })}
          </p>
          <SizeVsReviewCostChartView data={data} />
        </div>
      </div>
    </Panel>
  )
}

export const SizeVsReviewChart = connector(Wrapper)
