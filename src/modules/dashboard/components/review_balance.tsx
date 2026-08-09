import { useIntl } from 'react-intl'
import { ReviewBalanceChart as ChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './review_balance.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.review_balance.title' })}
      help={intl.formatMessage({ id: 'chart.review_balance.help' })}
    >
      <ChartView data={data} />
    </Panel>
  )
}

export const ReviewBalance = connector(Wrapper)
