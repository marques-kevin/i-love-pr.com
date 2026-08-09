import { useIntl } from 'react-intl'
import { ReviewRoundsChart as ReviewRoundsChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './review_rounds.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.review_rounds.title' })}
      help={intl.formatMessage({ id: 'chart.review_rounds.help' })}
    >
      <ReviewRoundsChartView data={data} />
    </Panel>
  )
}

export const ReviewRounds = connector(Wrapper)
