import { useIntl } from 'react-intl'
import { CyclePercentilesChart as CyclePercentilesChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './cycle_percentiles.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.cycle_percentiles.title' })}
      help={intl.formatMessage({ id: 'chart.cycle_percentiles.help' })}
    >
      <CyclePercentilesChartView data={data} />
    </Panel>
  )
}

export const CyclePercentiles = connector(Wrapper)
