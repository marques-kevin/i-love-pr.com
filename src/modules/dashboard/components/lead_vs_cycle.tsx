import { useIntl } from 'react-intl'
import { LeadVsCycleChart as ChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './lead_vs_cycle.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.lead_vs_cycle.title' })}
      help={intl.formatMessage({ id: 'chart.lead_vs_cycle.help' })}
    >
      <ChartView data={data} />
    </Panel>
  )
}

export const LeadVsCycle = connector(Wrapper)
