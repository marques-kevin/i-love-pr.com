import { CustomDashboard } from './custom_dashboard'
import { DashboardFilters } from './dashboard_filters'
import { MetricsGate } from './metrics_gate'
import { PeriodFilter } from './period_filter'
import { SyncCoverage } from '@/modules/sync'

export function Wrapper() {
  return (
    <div className="space-y-8">
      <SyncCoverage />
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
