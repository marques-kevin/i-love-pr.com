import { useIntl } from 'react-intl'
import { RoundsVsSizeChart as ChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './rounds_vs_size.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.rounds_vs_size.title' })}
      help={intl.formatMessage({ id: 'chart.rounds_vs_size.help' })}
    >
      <ChartView data={data} />
    </Panel>
  )
}

export const RoundsVsSize = connector(Wrapper)
