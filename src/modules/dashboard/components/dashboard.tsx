import { CycleTimeChart } from './cycle_time_chart'
import { MemberFilter } from './member_filter'
import { MetricsGate } from './metrics_gate'
import { OpenPRsList } from './open_prs_list'
import { PeriodFilter } from './period_filter'
import { PRSizeChart } from './pr_size_chart'
import { RepoFilter } from './repo_filter'
import { ReviewerChart } from './reviewer_chart'
import { SizeReviewInsight } from './size_review_insight'
import { SizeReviewScatterChart } from './size_review_scatter_chart'
import { SizeVsReviewChart } from './size_vs_review_chart'
import { SummaryStats } from './summary_stats'
import { ThroughputChart } from './throughput_chart'

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
        <div className="space-y-8">
          <SummaryStats />

          <section className="grid gap-6 lg:grid-cols-2">
            <CycleTimeChart />
            <ThroughputChart />
            <PRSizeChart />
            <ReviewerChart />
          </section>

          <section className="space-y-4">
            <SizeReviewInsight />
            <div className="grid gap-6 lg:grid-cols-2">
              <SizeVsReviewChart />
              <SizeReviewScatterChart />
            </div>
          </section>

          <OpenPRsList />
        </div>
      </MetricsGate>
    </div>
  )
}

export const Dashboard = Wrapper
