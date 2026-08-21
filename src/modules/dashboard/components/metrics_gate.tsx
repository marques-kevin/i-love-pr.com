import type { ReactNode } from 'react'
import { useIntl } from 'react-intl'
import { connector, type ConnectorProps } from './metrics_gate.connector'

type Props = ConnectorProps & { children: ReactNode }

export function Wrapper({ loading, has_metrics, children }: Props) {
  const intl = useIntl()

  if (loading && !has_metrics) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-3xl" />
        ))}
      </div>
    )
  }

  if (!has_metrics) {
    return <p className="text-base-content/60">{intl.formatMessage({ id: 'metrics.empty' })}</p>
  }

  return <>{children}</>
}

export const MetricsGate = connector(Wrapper)
