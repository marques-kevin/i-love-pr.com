import { useIntl } from 'react-intl'
import { CycleBreakdownChart as ChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './cycle_breakdown.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.cycle_breakdown.title' })}
      description={intl.formatMessage({ id: 'chart.cycle_breakdown.description' })}
    >
      <ChartView data={data} />
    </Panel>
  )
}

export const CycleBreakdown = connector(Wrapper)
