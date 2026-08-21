import { DashboardFilters } from './dashboard_filters'
import { PeriodFilter } from './period_filter'

export function DashboardToolbar() {
  return (
    <div className="bg-base-100 border-b border-base-300/40 px-3 py-1.5 flex flex-wrap items-center gap-2">
      <DashboardFilters />
      <div className="ml-auto min-w-0">
        <PeriodFilter />
      </div>
    </div>
  )
}
