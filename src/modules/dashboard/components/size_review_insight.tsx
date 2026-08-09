import { useIntl } from 'react-intl'
import { correlationInsight } from './charts'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './size_review_insight.connector'

export function Wrapper({ correlation }: ConnectorProps) {
  const intl = useIntl()
  if (!correlation) return null

  const metric_label = intl.formatMessage({ id: 'insight.metric_approve' })

  return (
    <Panel
      title={intl.formatMessage({ id: 'insight.title' })}
      help={intl.formatMessage({ id: 'insight.help' })}
    >
      <p className="text-sm text-muted-foreground">
        {correlationInsight(
          correlation.linesVsTimeToApprove,
          correlation.sampleSize,
          metric_label,
          (descriptor, values) => intl.formatMessage(descriptor, values),
        )}
      </p>
    </Panel>
  )
}

export const SizeReviewInsight = connector(Wrapper)
