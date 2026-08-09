import { SizeReviewScatterChart as SizeReviewScatterChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './size_review_scatter_chart.connector'

export function Wrapper({ data }: ConnectorProps) {
  if (!data) return null
  return (
    <Panel
      title="Scatter: lines vs request → approve"
      description="Each point is a merged PR with at least one human APPROVED review."
    >
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviewed PRs in this period/filter.</p>
      ) : (
        <SizeReviewScatterChartView data={data} />
      )}
    </Panel>
  )
}

export const SizeReviewScatterChart = connector(Wrapper)
