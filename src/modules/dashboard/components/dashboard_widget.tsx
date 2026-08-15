import type { ReactNode } from 'react'
import type { DashboardWidgetId } from '@/lib/types'
import { AdditionsDeletions } from './additions_deletions'
import { AuthorCycleRanking } from './author_cycle_ranking'
import { AuthorLeaderboard } from './author_leaderboard'
import { CycleBreakdown } from './cycle_breakdown'
import { CyclePercentiles } from './cycle_percentiles'
import { CycleTimeChart } from './cycle_time_chart'
import { DraftLatency } from './draft_latency'
import { FlowVolume } from './flow_volume'
import { LeadVsCycle } from './lead_vs_cycle'
import { NoReviewMerges } from './no_review_merges'
import { OpenPrAge } from './open_pr_age'
import { OpenPRsList } from './open_prs_list'
import { PRSizeChart } from './pr_size_chart'
import { RepoComparison } from './repo_comparison'
import { ReviewBalance } from './review_balance'
import { ReviewLatency } from './review_latency'
import { ReviewRounds } from './review_rounds'
import { ReviewStateMix } from './review_state_mix'
import { ReviewerChart } from './reviewer_chart'
import { RoundsVsSize } from './rounds_vs_size'
import { SizeReviewCostChart } from './size_review_cost_chart'
import { SizeReviewScatterChart } from './size_review_scatter_chart'
import { SizeVsReviewChart } from './size_vs_review_chart'
import { SummaryStats } from './summary_stats'
import { ThroughputChart } from './throughput_chart'

const WIDGET_COMPONENTS = {
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
  draft_latency: () => <DraftLatency />,
  lead_vs_cycle: () => <LeadVsCycle />,
  repo_comparison: () => <RepoComparison />,
  author_cycle_ranking: () => <AuthorCycleRanking />,
  review_balance: () => <ReviewBalance />,
  review_state_mix: () => <ReviewStateMix />,
  additions_deletions: () => <AdditionsDeletions />,
  rounds_vs_size: () => <RoundsVsSize />,
} satisfies Record<DashboardWidgetId, () => ReactNode>

export function DashboardWidget({ widget_id }: { widget_id: DashboardWidgetId }) {
  const render = WIDGET_COMPONENTS[widget_id]
  return <>{render()}</>
}
