import { SizeVsReviewTimeChart as SizeVsReviewTimeChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './size_vs_review_chart.connector'

export function Wrapper({ data }: ConnectorProps) {
  if (!data) return null
  return (
    <Panel
      title="Avg review time by size"
      description="First human review vs time from review request to first approve."
    >
      <SizeVsReviewTimeChartView data={data} />
      <ul className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        {data.map((row) => (
          <li key={row.bucket}>
            <span className="font-medium text-foreground">{row.bucket}</span>
            {' · '}
            n={row.count}
            {row.avgHoursPerHundredLines != null && (
              <>
                {' · '}
                {row.avgHoursPerHundredLines.toFixed(1)}h approve / 100 lines
              </>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export const SizeVsReviewChart = connector(Wrapper)
