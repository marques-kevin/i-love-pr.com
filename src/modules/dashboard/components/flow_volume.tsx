import { useIntl } from 'react-intl'
import { FlowVolumeChart as FlowVolumeChartView } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './flow_volume.connector'

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null
  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.flow_volume.title' })}
      help={intl.formatMessage({ id: 'chart.flow_volume.help' })}
    >
      <FlowVolumeChartView data={data} />
    </Panel>
  )
}

export const FlowVolume = connector(Wrapper)
