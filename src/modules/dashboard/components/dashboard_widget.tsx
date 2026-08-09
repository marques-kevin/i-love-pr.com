import type { ReactNode } from 'react'
import type { DashboardWidgetId } from '@/lib/types'
import { AuthorLeaderboard } from './author_leaderboard'
import { CycleBreakdown } from './cycle_breakdown'
import { CyclePercentiles } from './cycle_percentiles'
import { CycleTimeChart } from './cycle_time_chart'
import { FlowVolume } from './flow_volume'
import { NoReviewMerges } from './no_review_merges'
import { OpenPrAge } from './open_pr_age'
import { OpenPRsList } from './open_prs_list'
import { PRSizeChart } from './pr_size_chart'
import { ReviewLatency } from './review_latency'
import { ReviewRounds } from './review_rounds'
import { ReviewerChart } from './reviewer_chart'
import { SizeReviewCostChart } from './size_review_cost_chart'
import { SizeReviewScatterChart } from './size_review_scatter_chart'
import { SizeVsReviewChart } from './size_vs_review_chart'
import { SummaryStats } from './summary_stats'
import { ThroughputChart } from './throughput_chart'

const WIDGET_COMPONENTS: Record<DashboardWidgetId, () => ReactNode> = {
  summary_stats: () => <SummaryStats />,
  cycle_time: () => <CycleTimeChart />,
  throughput: () => <ThroughputChart />,
  pr_size: () => <PRSizeChart />,
  reviewer_load: () => <ReviewerChart />,
  size_vs_review: () => <SizeVsReviewChart />,
  size_review_cost: () => <SizeReviewCostChart />,
  size_review_scatter: () => <SizeReviewScatterChart />,
  open_prs: () => <OpenPRsList />,
  cycle_breakdown: () => <CycleBreakdown />,
  review_latency: () => <ReviewLatency />,
  cycle_percentiles: () => <CyclePercentiles />,
  review_rounds: () => <ReviewRounds />,
  no_review_merges: () => <NoReviewMerges />,
  author_leaderboard: () => <AuthorLeaderboard />,
  open_pr_age: () => <OpenPrAge />,
  flow_volume: () => <FlowVolume />,
}

export function DashboardWidget({ widget_id }: { widget_id: DashboardWidgetId }) {
  const render = WIDGET_COMPONENTS[widget_id]
  return <>{render()}</>
}
