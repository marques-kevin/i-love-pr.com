import { useIntl } from 'react-intl'
import { AdditionsDeletionsChart as ChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './additions_deletions.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.additions_deletions.title' })}
      help={intl.formatMessage({ id: 'chart.additions_deletions.help' })}
    >
      <ChartView data={data} />
    </Panel>
  )
}

export const AdditionsDeletions = connector(Wrapper)
