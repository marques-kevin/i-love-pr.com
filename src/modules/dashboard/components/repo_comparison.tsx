import { useIntl } from 'react-intl'
import { RepoComparisonChart as ChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './repo_comparison.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.repo_comparison.title' })}
      help={intl.formatMessage({ id: 'chart.repo_comparison.help' })}
    >
      <ChartView data={data} />
    </Panel>
  )
}

export const RepoComparison = connector(Wrapper)
