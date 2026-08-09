import { useIntl } from 'react-intl'
import { CycleTimeChart as CycleTimeChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './cycle_time_chart.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel title={intl.formatMessage({ id: 'chart.cycle_time.title' })}>
      <CycleTimeChartView data={data} />
    </Panel>
  )
}

export const CycleTimeChart = connector(Wrapper)
