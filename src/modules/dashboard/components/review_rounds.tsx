import { useIntl } from 'react-intl'
import { ReviewRoundsChart as ChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './review_rounds.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel title={intl.formatMessage({ id: 'chart.review_rounds.title' })}>
      <ChartView data={data} />
    </Panel>
  )
}

export const ReviewRounds = connector(Wrapper)
