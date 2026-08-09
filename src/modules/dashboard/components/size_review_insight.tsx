import { correlationInsight } from './charts'
import { connector, type ConnectorProps } from './size_review_insight.connector'

export function Wrapper({ correlation }: ConnectorProps) {
  if (!correlation) return null
  return (
    <div>
      <h2 className="font-display text-xl font-bold tracking-tight">
        Does PR size slow down review?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {correlationInsight(
          correlation.linesVsTimeToApprove,
          correlation.sampleSize,
          'request → approve',
        )}
      </p>
    </div>
  )
}

export const SizeReviewInsight = connector(Wrapper)
