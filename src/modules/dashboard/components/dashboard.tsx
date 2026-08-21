import { CustomDashboard } from './custom_dashboard'
import { MetricsGate } from './metrics_gate'

export function Wrapper() {
  return (
    <MetricsGate>
      <CustomDashboard />
    </MetricsGate>
  )
}

export const Dashboard = Wrapper
