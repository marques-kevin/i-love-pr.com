import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { useIntl } from 'react-intl'
import { Bar as DitherBar } from '@/components/dither-kit/bar'
import { BarChart as DitherBarChart } from '@/components/dither-kit/bar-chart'
import type { ChartConfig as DitherChartConfig } from '@/components/dither-kit/chart-context'
import { Grid as DitherGrid } from '@/components/dither-kit/grid'
import { Tooltip as DitherTooltip } from '@/components/dither-kit/tooltip'
import { XAxis as DitherXAxis } from '@/components/dither-kit/x-axis'
import { YAxis as DitherYAxis } from '@/components/dither-kit/y-axis'
import { is_external_object, is_number_value, is_string_value } from '@/lib/boundary_parse'
import type { ExternalValue } from '@/lib/json_value'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { MetricsSnapshot } from '@/lib/types'

const cycleConfig = {
  avgHours: { label: 'Avg cycle time (h)', color: 'var(--chart-1)' },
} satisfies ChartConfig

const sizeConfig = {
  count: { label: 'PRs', color: 'red' },
} satisfies DitherChartConfig

const throughputConfig = {
  count: { label: 'Merged PRs', color: 'var(--chart-3)' },
} satisfies ChartConfig

const reviewerConfig = {
  given: { label: 'Reviews given', color: 'var(--chart-1)' },
  received: { label: 'Reviews received', color: 'var(--chart-2)' },
} satisfies ChartConfig

const sizeVsReviewColors = {
  avgTimeToFirstReviewHours: 'var(--chart-1)',
  avgTimeToApproveHours: 'var(--chart-2)',
} as const

const sizeVsReviewCostConfig = {
  avgHoursPerHundredLines: {
    label: 'Approve h / 100 lines',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

const scatterConfig = {
  timeToApproveHours: {
    label: 'Ask/ready/created → approve (h)',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

const cycleBreakdownConfig = {
  createToAskHours: { label: 'Create → ask (h)', color: 'var(--chart-1)' },
  askToFirstReviewHours: { label: 'Ask → first review (h)', color: 'var(--chart-2)' },
  firstReviewToApproveHours: { label: 'First review → approve (h)', color: 'var(--chart-3)' },
  approveToMergeHours: { label: 'Approve → merge (h)', color: 'var(--chart-4)' },
} satisfies ChartConfig

const reviewLatencyColors = {
  avgTimeToFirstReviewHours: 'var(--chart-1)',
  avgTimeToApproveHours: 'var(--chart-2)',
} as const

const cyclePercentilesConfig = {
  p50Hours: { label: 'p50 (h)', color: 'var(--chart-1)' },
  p95Hours: { label: 'p95 (h)', color: 'var(--chart-2)' },
} satisfies ChartConfig

const reviewRoundsConfig = {
  count: { label: 'PRs', color: 'var(--chart-1)' },
} satisfies ChartConfig

const openPrAgeConfig = {
  count: { label: 'Open PRs', color: 'var(--chart-1)' },
} satisfies ChartConfig

const flowVolumeConfig = {
  opened: { label: 'Opened', color: 'var(--chart-2)' },
  merged: { label: 'Merged', color: 'var(--chart-1)' },
} satisfies ChartConfig

const draftLatencyConfig = {
  avgHours: { label: 'Create → ask (h)', color: 'var(--chart-1)' },
} satisfies ChartConfig

const leadVsCycleConfig = {
  leadHours: { label: 'Lead: create → merge (h)', color: 'var(--chart-1)' },
  reviewCycleHours: { label: 'Review cycle: ask → approve (h)', color: 'var(--chart-2)' },
} satisfies ChartConfig

const repoComparisonConfig = {
  mergedCount: { label: 'Merged PRs', color: 'var(--chart-1)' },
} satisfies ChartConfig

const authorCycleConfig = {
  avgCycleTimeHours: { label: 'Avg cycle (h)', color: 'var(--chart-1)' },
} satisfies ChartConfig

const reviewBalanceConfig = {
  ratio: { label: 'Given / received', color: 'var(--chart-3)' },
} satisfies ChartConfig

const reviewStateMixConfig = {
  approved: { label: 'APPROVED', color: 'var(--chart-1)' },
  changesRequested: { label: 'CHANGES_REQUESTED', color: 'var(--chart-2)' },
  commented: { label: 'COMMENTED', color: 'var(--chart-3)' },
} satisfies ChartConfig

const additionsDeletionsConfig = {
  additions: { label: 'Additions', color: 'var(--chart-1)' },
  deletions: { label: 'Deletions', color: 'var(--chart-2)' },
} satisfies ChartConfig

const roundsVsSizeConfig = {
  avgReviewRounds: { label: 'Avg review rounds', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function CycleTimeChart({ data }: { data: MetricsSnapshot['cycleTimeSeries'] }) {
  return (
    <ChartContainer config={cycleConfig} className="aspect-auto h-72 w-full">
      <LineChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="avgHours"
          stroke="var(--color-avgHours)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}

export function PRSizeChart({ data }: { data: MetricsSnapshot['prSizeBuckets'] }) {
  return (
    <div className="aspect-auto h-72 w-full">
      <DitherBarChart data={data} config={sizeConfig} bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="bucket" />
        <DitherYAxis />
        <DitherTooltip labelKey="bucket" />
        <DitherBar dataKey="count" variant="hatched" />
      </DitherBarChart>
    </div>
  )
}

export function ReviewerChart({ data }: { data: MetricsSnapshot['reviewerLoad'] }) {
  return (
    <ChartContainer config={reviewerConfig} className="aspect-auto h-80 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="reviewer" width={96} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="given" fill="var(--color-given)" radius={4} isAnimationActive={false} />
        <Bar dataKey="received" fill="var(--color-received)" radius={4} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}

export function ThroughputChart({ data }: { data: MetricsSnapshot['throughput'] }) {
  const byWeek = new Map<string, number>()
  for (const row of data) {
    byWeek.set(row.period, (byWeek.get(row.period) ?? 0) + row.count)
  }
  const chartData = [...byWeek.entries()]
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period))

  return (
    <ChartContainer config={throughputConfig} className="aspect-auto h-72 w-full">
      <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={6} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}

export function SizeVsReviewTimeChart({ data }: { data: MetricsSnapshot['sizeVsReviewTime'] }) {
  const intl = useIntl()
  const config = {
    avgTimeToFirstReviewHours: {
      label: intl.formatMessage({ id: 'chart.legend.wait_to_first_review' }),
      color: sizeVsReviewColors.avgTimeToFirstReviewHours,
    },
    avgTimeToApproveHours: {
      label: intl.formatMessage({ id: 'chart.legend.wait_to_approve' }),
      color: sizeVsReviewColors.avgTimeToApproveHours,
    },
  } satisfies ChartConfig

  const chartData = data.map((row) => ({
    ...row,
    avgTimeToFirstReviewHours:
      row.avgTimeToFirstReviewHours != null
        ? Math.round(row.avgTimeToFirstReviewHours * 10) / 10
        : 0,
    avgTimeToApproveHours:
      row.avgTimeToApproveHours != null ? Math.round(row.avgTimeToApproveHours * 10) / 10 : 0,
  }))

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="avgTimeToFirstReviewHours"
          fill="var(--color-avgTimeToFirstReviewHours)"
          radius={4}
          isAnimationActive={false}
        />
        <Bar
          dataKey="avgTimeToApproveHours"
          fill="var(--color-avgTimeToApproveHours)"
          radius={4}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  )
}

export function SizeVsReviewCostChart({ data }: { data: MetricsSnapshot['sizeVsReviewTime'] }) {
  const chartData = data.map((row) => ({
    bucket: row.bucket,
    count: row.count,
    avgHoursPerHundredLines:
      row.avgHoursPerHundredLines != null ? Math.round(row.avgHoursPerHundredLines * 10) / 10 : 0,
  }))

  return (
    <ChartContainer config={sizeVsReviewCostConfig} className="aspect-auto h-72 w-full">
      <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="avgHoursPerHundredLines"
          fill="var(--color-avgHoursPerHundredLines)"
          radius={4}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  )
}

export function SizeReviewScatterChart({ data }: { data: MetricsSnapshot['sizeReviewScatter'] }) {
  const points = data
    .filter((p) => p.timeToApproveHours != null)
    .map((p) => ({
      ...p,
      timeToApproveHours: p.timeToApproveHours!,
      label: `#${p.number}`,
    }))

  return (
    <ChartContainer config={scatterConfig} className="aspect-auto h-72 w-full">
      <ScatterChart margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="lines"
          name="Lines"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          label={{ value: 'Lines changed', position: 'insideBottom', offset: -2 }}
        />
        <YAxis
          type="number"
          dataKey="timeToApproveHours"
          name="Approve (h)"
          tickLine={false}
          axisLine={false}
          width={40}
          label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
        />
        <ZAxis range={[40, 40]} />
        <ChartTooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null
            const point = parse_scatter_tooltip_point(payload[0].payload ?? null)
            if (!point) return null
            return (
              <div className="rounded-lg border border-base-300/50 bg-base-100 px-2.5 py-1.5 text-xs shadow-xl">
                <p className="font-medium">
                  #{point.number} · {point.lines} lines
                </p>
                <p className="text-base-content/60">
                  Request → approve: {point.timeToApproveHours.toFixed(1)}h
                  {point.timeToFirstReviewHours > 0 && (
                    <> · First review: {point.timeToFirstReviewHours.toFixed(1)}h</>
                  )}
                </p>
                <p className="truncate text-base-content/60">{point.title}</p>
              </div>
            )
          }}
        />
        <Scatter
          data={points}
          fill="var(--color-timeToApproveHours)"
          fillOpacity={0.55}
          isAnimationActive={false}
        />
      </ScatterChart>
    </ChartContainer>
  )
}

export function CycleBreakdownChart({ data }: { data: MetricsSnapshot['cycleBreakdownSeries'] }) {
  return (
    <ChartContainer config={cycleBreakdownConfig} className="aspect-auto h-72 w-full">
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="createToAskHours"
          stackId="cycle"
          fill="var(--color-createToAskHours)"
          radius={0}
          isAnimationActive={false}
        />
        <Bar
          dataKey="askToFirstReviewHours"
          stackId="cycle"
          fill="var(--color-askToFirstReviewHours)"
          radius={0}
          isAnimationActive={false}
        />
        <Bar
          dataKey="firstReviewToApproveHours"
          stackId="cycle"
          fill="var(--color-firstReviewToApproveHours)"
          radius={0}
          isAnimationActive={false}
        />
        <Bar
          dataKey="approveToMergeHours"
          stackId="cycle"
          fill="var(--color-approveToMergeHours)"
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  )
}

export function ReviewLatencyChart({ data }: { data: MetricsSnapshot['reviewLatencySeries'] }) {
  const intl = useIntl()
  const config = {
    avgTimeToFirstReviewHours: {
      label: intl.formatMessage({ id: 'chart.legend.wait_to_first_review' }),
      color: reviewLatencyColors.avgTimeToFirstReviewHours,
    },
    avgTimeToApproveHours: {
      label: intl.formatMessage({ id: 'chart.legend.wait_to_approve' }),
      color: reviewLatencyColors.avgTimeToApproveHours,
    },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <LineChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="avgTimeToFirstReviewHours"
          stroke="var(--color-avgTimeToFirstReviewHours)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="avgTimeToApproveHours"
          stroke="var(--color-avgTimeToApproveHours)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}

export function CyclePercentilesChart({
  data,
}: {
  data: MetricsSnapshot['cyclePercentileSeries']
}) {
  return (
    <ChartContainer config={cyclePercentilesConfig} className="aspect-auto h-72 w-full">
      <LineChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="p50Hours"
          stroke="var(--color-p50Hours)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="p95Hours"
          stroke="var(--color-p95Hours)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}

export function ReviewRoundsChart({ data }: { data: MetricsSnapshot['reviewRoundsBuckets'] }) {
  return (
    <ChartContainer config={reviewRoundsConfig} className="aspect-auto h-72 w-full">
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="rounds" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={6} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}

export function OpenPrAgeChart({ data }: { data: MetricsSnapshot['openPrAgeBuckets'] }) {
  return (
    <ChartContainer config={openPrAgeConfig} className="aspect-auto h-72 w-full">
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={6} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}

export function FlowVolumeChart({ data }: { data: MetricsSnapshot['flowVolumeSeries'] }) {
  return (
    <ChartContainer config={flowVolumeConfig} className="aspect-auto h-72 w-full">
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="opened" fill="var(--color-opened)" radius={4} isAnimationActive={false} />
        <Bar dataKey="merged" fill="var(--color-merged)" radius={4} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}

export function DraftLatencyChart({ data }: { data: MetricsSnapshot['draftLatencySeries'] }) {
  return (
    <ChartContainer config={draftLatencyConfig} className="aspect-auto h-72 w-full">
      <LineChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="avgHours"
          stroke="var(--color-avgHours)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}

export function LeadVsCycleChart({ data }: { data: MetricsSnapshot['leadVsCycleSeries'] }) {
  return (
    <ChartContainer config={leadVsCycleConfig} className="aspect-auto h-72 w-full">
      <LineChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="leadHours"
          stroke="var(--color-leadHours)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="reviewCycleHours"
          stroke="var(--color-reviewCycleHours)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}

export function RepoComparisonChart({ data }: { data: MetricsSnapshot['repoComparison'] }) {
  const chart_data = data.map((row) => ({
    ...row,
    label: row.repo.includes('/') ? row.repo.split('/').slice(-1)[0] : row.repo,
  }))
  return (
    <ChartContainer config={repoComparisonConfig} className="aspect-auto h-80 w-full">
      <BarChart data={chart_data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="label" width={96} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="mergedCount"
          fill="var(--color-mergedCount)"
          radius={4}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  )
}

export function AuthorCycleRankingChart({ data }: { data: MetricsSnapshot['authorCycleRanking'] }) {
  return (
    <ChartContainer config={authorCycleConfig} className="aspect-auto h-80 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="author" width={96} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="avgCycleTimeHours"
          fill="var(--color-avgCycleTimeHours)"
          radius={4}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  )
}

export function ReviewBalanceChart({ data }: { data: MetricsSnapshot['reviewBalance'] }) {
  const chart_data = data
    .filter((row) => row.ratio != null)
    .map((row) => ({ ...row, ratio: row.ratio! }))
  return (
    <ChartContainer config={reviewBalanceConfig} className="aspect-auto h-80 w-full">
      <BarChart data={chart_data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="person" width={96} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="ratio" fill="var(--color-ratio)" radius={4} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}

export function ReviewStateMixChart({ data }: { data: MetricsSnapshot['reviewStateMixSeries'] }) {
  return (
    <ChartContainer config={reviewStateMixConfig} className="aspect-auto h-72 w-full">
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="approved"
          stackId="state"
          fill="var(--color-approved)"
          radius={0}
          isAnimationActive={false}
        />
        <Bar
          dataKey="changesRequested"
          stackId="state"
          fill="var(--color-changesRequested)"
          radius={0}
          isAnimationActive={false}
        />
        <Bar
          dataKey="commented"
          stackId="state"
          fill="var(--color-commented)"
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  )
}

export function AdditionsDeletionsChart({
  data,
}: {
  data: MetricsSnapshot['additionsDeletionsSeries']
}) {
  return (
    <ChartContainer config={additionsDeletionsConfig} className="aspect-auto h-72 w-full">
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="additions"
          fill="var(--color-additions)"
          radius={4}
          isAnimationActive={false}
        />
        <Bar
          dataKey="deletions"
          fill="var(--color-deletions)"
          radius={4}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  )
}

export function RoundsVsSizeChart({ data }: { data: MetricsSnapshot['roundsVsSize'] }) {
  const chart_data = data.map((row) => ({
    bucket: row.bucket,
    count: row.count,
    avgReviewRounds: row.avgReviewRounds != null ? Math.round(row.avgReviewRounds * 10) / 10 : 0,
  }))
  return (
    <ChartContainer config={roundsVsSizeConfig} className="aspect-auto h-72 w-full">
      <BarChart data={chart_data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="avgReviewRounds"
          fill="var(--color-avgReviewRounds)"
          radius={4}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  )
}

type ScatterTooltipPoint = MetricsSnapshot['sizeReviewScatter'][number] & {
  timeToApproveHours: number
  label: string
}

function parse_scatter_tooltip_point(
  raw: ExternalValue | null | undefined,
): ScatterTooltipPoint | null {
  if (raw === null || raw === undefined || !is_external_object(raw)) return null
  const lines = raw.lines
  const timeToApproveHours = raw.timeToApproveHours
  const number = raw.number
  const timeToFirstReviewHours = raw.timeToFirstReviewHours
  if (!is_number_value(lines) || !is_number_value(timeToApproveHours) || !is_number_value(number)) {
    return null
  }
  return {
    lines,
    timeToApproveHours,
    number,
    timeToFirstReviewHours: is_number_value(timeToFirstReviewHours) ? timeToFirstReviewHours : 0,
    cycleTimeHours: is_number_value(raw.cycleTimeHours) ? raw.cycleTimeHours : null,
    title: is_string_value(raw.title) ? raw.title : '',
    repoFullName: is_string_value(raw.repoFullName) ? raw.repoFullName : '',
    label: is_string_value(raw.label) ? raw.label : `#${number}`,
  }
}
