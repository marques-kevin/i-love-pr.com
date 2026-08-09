import { useIntl } from 'react-intl'
import { PRSizeChart as PRSizeChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './pr_size_chart.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.pr_size.title' })}
      help={intl.formatMessage({ id: 'chart.pr_size.help' })}
    >
      <PRSizeChartView data={data} />
    </Panel>
  )
}

export const PRSizeChart = connector(Wrapper)
