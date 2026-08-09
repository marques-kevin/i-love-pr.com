import type { ReactNode } from 'react'
import type { DashboardWidgetId } from '@/lib/types'
import { CycleTimeChart } from './cycle_time_chart'
import { OpenPRsList } from './open_prs_list'
import { PRSizeChart } from './pr_size_chart'
import { ReviewerChart } from './reviewer_chart'
import { SizeReviewInsight } from './size_review_insight'
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
  size_review_insight: () => <SizeReviewInsight />,
  size_vs_review: () => <SizeVsReviewChart />,
  size_review_scatter: () => <SizeReviewScatterChart />,
  open_prs: () => <OpenPRsList />,
}

export function DashboardWidget({ widget_id }: { widget_id: DashboardWidgetId }) {
  const render = WIDGET_COMPONENTS[widget_id]
  return <>{render()}</>
}
