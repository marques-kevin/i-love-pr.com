import { useIntl } from 'react-intl'
import { ReviewStateMixChart as ChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './review_state_mix.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.review_state_mix.title' })}
      help={intl.formatMessage({ id: 'chart.review_state_mix.help' })}
    >
      <ChartView data={data} />
    </Panel>
  )
}

export const ReviewStateMix = connector(Wrapper)
