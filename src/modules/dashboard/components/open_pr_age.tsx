import { useIntl } from 'react-intl'
import { OpenPrAgeChart as OpenPrAgeChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './open_pr_age.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.open_pr_age.title' })}
      help={intl.formatMessage({ id: 'chart.open_pr_age.help' })}
    >
      <OpenPrAgeChartView data={data} />
    </Panel>
  )
}

export const OpenPrAge = connector(Wrapper)
