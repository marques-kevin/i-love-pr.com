import { CustomDashboard } from './custom_dashboard'
import { MemberFilter } from './member_filter'
import { MetricsGate } from './metrics_gate'
import { PeriodFilter } from './period_filter'
import { RepoFilter } from './repo_filter'

export function Wrapper() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <RepoFilter />
          <PeriodFilter />
        </div>
        <MemberFilter />
      </div>

      <MetricsGate>
        <CustomDashboard />
      </MetricsGate>
    </div>
  )
}

export const Dashboard = Wrapper
