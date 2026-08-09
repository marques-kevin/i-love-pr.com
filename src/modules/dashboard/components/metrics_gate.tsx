import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { connector, type ConnectorProps } from './metrics_gate.connector'

type Props = ConnectorProps & { children: ReactNode }

export function Wrapper({ loading, has_metrics, children }: Props) {
  if (loading && !has_metrics) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!has_metrics) {
    return <p className="text-muted-foreground">No data yet. Run a sync to pull pull requests.</p>
  }

  return <>{children}</>
}

export const MetricsGate = connector(Wrapper)
