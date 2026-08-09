import { useEffect } from 'react'
import { connector, type ConnectorProps } from './metrics_refresher.connector'

export function Wrapper({
  selected_repos,
  members,
  period_key,
  custom_from,
  custom_to,
  refresh_metrics,
}: ConnectorProps) {
  useEffect(() => {
    void refresh_metrics()
  }, [selected_repos, members, period_key, custom_from, custom_to, refresh_metrics])

  return null
}

export const MetricsRefresher = connector(Wrapper)
