import { useIntl } from 'react-intl'
import { AuthorCycleRankingChart as ChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './author_cycle_ranking.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.author_cycle_ranking.title' })}
      help={intl.formatMessage({ id: 'chart.author_cycle_ranking.help' })}
    >
      <ChartView data={data} />
    </Panel>
  )
}

export const AuthorCycleRanking = connector(Wrapper)
