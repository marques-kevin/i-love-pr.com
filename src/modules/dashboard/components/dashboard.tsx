import { CustomDashboard } from './custom_dashboard'
import { DashboardFilters } from './dashboard_filters'
import { MetricsGate } from './metrics_gate'
import { PeriodFilter } from './period_filter'

export function Wrapper() {
  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <DashboardFilters />
        <PeriodFilter />
      </div>

      <MetricsGate>
        <CustomDashboard />
      </MetricsGate>
    </div>
  )
}

export const Dashboard = Wrapper
