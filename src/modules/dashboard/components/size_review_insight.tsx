import { useIntl } from 'react-intl'
import { correlationInsight } from './charts'
import { connector, type ConnectorProps } from './size_review_insight.connector'

export function Wrapper({ correlation }: ConnectorProps) {
  const intl = useIntl()
  if (!correlation) return null

  const metric_label = intl.formatMessage({ id: 'insight.metric_approve' })

  return (
    <div>
      <h2 className="font-display text-xl font-bold tracking-tight">
        {intl.formatMessage({ id: 'insight.title' })}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {correlationInsight(
          correlation.linesVsTimeToApprove,
          correlation.sampleSize,
          metric_label,
          (descriptor, values) => intl.formatMessage(descriptor, values),
        )}
      </p>
    </div>
  )
}

export const SizeReviewInsight = connector(Wrapper)
