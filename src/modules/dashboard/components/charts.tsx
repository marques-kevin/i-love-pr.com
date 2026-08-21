import { Bar, BarChart, CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from 'recharts'
import { useIntl } from 'react-intl'
import { Line as DitherLine } from '@/components/dither-kit/area'
import { LineChart as DitherLineChart } from '@/components/dither-kit/area-chart'
import { Bar as DitherBar } from '@/components/dither-kit/bar'
import { BarChart as DitherBarChart } from '@/components/dither-kit/bar-chart'
import type { ChartConfig as DitherChartConfig } from '@/components/dither-kit/chart-context'
import { Grid as DitherGrid } from '@/components/dither-kit/grid'
import { Legend as DitherLegend } from '@/components/dither-kit/legend'
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
  avgHours: { label: 'Avg cycle time (h)', color: 'red' },
} satisfies DitherChartConfig

const sizeConfig = {
  count: { label: 'PRs', color: 'red' },
} satisfies DitherChartConfig

const throughputConfig = {
  count: { label: 'Merged PRs', color: 'purple' },
} satisfies DitherChartConfig

const reviewerConfig = {
  given: { label: 'Reviews given', color: 'var(--chart-1)' },
  received: { label: 'Reviews received', color: 'var(--chart-2)' },
} satisfies ChartConfig

const sizeVsReviewCostConfig = {
  avgHoursPerHundredLines: {
    label: 'Approve h / 100 lines',
    color: 'purple',
  },
} satisfies DitherChartConfig

const scatterConfig = {
  timeToApproveHours: {
    label: 'Ask/ready/created → approve (h)',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

const cycleBreakdownConfig = {
  createToAskHours: { label: 'Create → ask (h)', color: 'red' },
  askToFirstReviewHours: { label: 'Ask → first review (h)', color: 'blue' },
  firstReviewToApproveHours: { label: 'First review → approve (h)', color: 'purple' },
  approveToMergeHours: { label: 'Approve → merge (h)', color: 'orange' },
} satisfies DitherChartConfig

const cyclePercentilesConfig = {
  p50Hours: { label: 'p50 (h)', color: 'red' },
  p95Hours: { label: 'p95 (h)', color: 'blue' },
} satisfies DitherChartConfig

const reviewRoundsConfig = {
  count: { label: 'PRs', color: 'red' },
} satisfies DitherChartConfig

const openPrAgeConfig = {
  count: { label: 'Open PRs', color: 'red' },
} satisfies DitherChartConfig

const flowVolumeConfig = {
  opened: { label: 'Opened', color: 'blue' },
  merged: { label: 'Merged', color: 'red' },
} satisfies DitherChartConfig

const draftLatencyConfig = {
  avgHours: { label: 'Create → ask (h)', color: 'red' },
} satisfies DitherChartConfig

const leadVsCycleConfig = {
  leadHours: { label: 'Lead: create → merge (h)', color: 'red' },
  reviewCycleHours: { label: 'Review cycle: ask → approve (h)', color: 'blue' },
} satisfies DitherChartConfig

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
  approved: { label: 'APPROVED', color: 'red' },
  changesRequested: { label: 'CHANGES_REQUESTED', color: 'blue' },
  commented: { label: 'COMMENTED', color: 'purple' },
} satisfies DitherChartConfig

const additionsDeletionsConfig = {
  additions: { label: 'Additions', color: 'red' },
  deletions: { label: 'Deletions', color: 'blue' },
} satisfies DitherChartConfig

const roundsVsSizeConfig = {
  avgReviewRounds: { label: 'Avg review rounds', color: 'red' },
} satisfies DitherChartConfig

export function CycleTimeChart({ data }: { data: MetricsSnapshot['cycleTimeSeries'] }) {
  return (
    <div className="aspect-auto h-72 w-full">
      <DitherLineChart data={data} config={cycleConfig} bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="date" />
        <DitherYAxis />
        <DitherTooltip labelKey="date" />
        <DitherLine dataKey="avgHours" />
      </DitherLineChart>
    </div>
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
    <div className="aspect-auto h-72 w-full">
      <DitherBarChart data={chartData} config={throughputConfig} bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="period" />
        <DitherYAxis />
        <DitherTooltip labelKey="period" />
        <DitherBar dataKey="count" variant="hatched" />
      </DitherBarChart>
    </div>
  )
}

export function SizeVsReviewTimeChart({ data }: { data: MetricsSnapshot['sizeVsReviewTime'] }) {
  const intl = useIntl()
  const config = {
    avgTimeToFirstReviewHours: {
      label: intl.formatMessage({ id: 'chart.legend.wait_to_first_review' }),
      color: 'red',
    },
    avgTimeToApproveHours: {
      label: intl.formatMessage({ id: 'chart.legend.wait_to_approve' }),
      color: 'blue',
    },
  } satisfies DitherChartConfig

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
    <div className="aspect-auto h-72 w-full">
      <DitherBarChart data={chartData} config={config} bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="bucket" />
        <DitherYAxis />
        <DitherLegend />
        <DitherTooltip labelKey="bucket" />
        <DitherBar dataKey="avgTimeToFirstReviewHours" variant="hatched" />
        <DitherBar dataKey="avgTimeToApproveHours" variant="hatched" />
      </DitherBarChart>
    </div>
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
    <div className="aspect-auto h-72 w-full">
      <DitherBarChart data={chartData} config={sizeVsReviewCostConfig} bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="bucket" />
        <DitherYAxis />
        <DitherLegend />
        <DitherTooltip labelKey="bucket" />
        <DitherBar dataKey="avgHoursPerHundredLines" variant="hatched" />
      </DitherBarChart>
    </div>
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
    <div className="aspect-auto h-72 w-full">
      <DitherBarChart data={data} config={cycleBreakdownConfig} stackType="stacked" bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="date" />
        <DitherYAxis />
        <DitherLegend />
        <DitherTooltip labelKey="date" />
        <DitherBar dataKey="createToAskHours" variant="hatched" />
        <DitherBar dataKey="askToFirstReviewHours" variant="hatched" />
        <DitherBar dataKey="firstReviewToApproveHours" variant="hatched" />
        <DitherBar dataKey="approveToMergeHours" variant="hatched" />
      </DitherBarChart>
    </div>
  )
}

export function ReviewLatencyChart({ data }: { data: MetricsSnapshot['reviewLatencySeries'] }) {
  const intl = useIntl()
  const config = {
    avgTimeToFirstReviewHours: {
      label: intl.formatMessage({ id: 'chart.legend.wait_to_first_review' }),
      color: 'red',
    },
    avgTimeToApproveHours: {
      label: intl.formatMessage({ id: 'chart.legend.wait_to_approve' }),
      color: 'blue',
    },
  } satisfies DitherChartConfig

  return (
    <div className="aspect-auto h-72 w-full">
      <DitherLineChart data={data} config={config} bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="date" />
        <DitherYAxis />
        <DitherLegend />
        <DitherTooltip labelKey="date" />
        <DitherLine dataKey="avgTimeToFirstReviewHours" />
        <DitherLine dataKey="avgTimeToApproveHours" />
      </DitherLineChart>
    </div>
  )
}

export function CyclePercentilesChart({
  data,
}: {
  data: MetricsSnapshot['cyclePercentileSeries']
}) {
  return (
    <div className="aspect-auto h-72 w-full">
      <DitherLineChart data={data} config={cyclePercentilesConfig} bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="date" />
        <DitherYAxis />
        <DitherLegend />
        <DitherTooltip labelKey="date" />
        <DitherLine dataKey="p50Hours" />
        <DitherLine dataKey="p95Hours" />
      </DitherLineChart>
    </div>
  )
}

export function ReviewRoundsChart({ data }: { data: MetricsSnapshot['reviewRoundsBuckets'] }) {
  return (
    <div className="aspect-auto h-72 w-full">
      <DitherBarChart data={data} config={reviewRoundsConfig} bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="rounds" />
        <DitherYAxis />
        <DitherTooltip labelKey="rounds" />
        <DitherBar dataKey="count" variant="hatched" />
      </DitherBarChart>
    </div>
  )
}

export function OpenPrAgeChart({ data }: { data: MetricsSnapshot['openPrAgeBuckets'] }) {
  return (
    <div className="aspect-auto h-72 w-full">
      <DitherBarChart data={data} config={openPrAgeConfig} bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="bucket" />
        <DitherYAxis />
        <DitherTooltip labelKey="bucket" />
        <DitherBar dataKey="count" variant="hatched" />
      </DitherBarChart>
    </div>
  )
}

export function FlowVolumeChart({ data }: { data: MetricsSnapshot['flowVolumeSeries'] }) {
  return (
    <div className="aspect-auto h-72 w-full">
      <DitherBarChart data={data} config={flowVolumeConfig} bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="date" />
        <DitherYAxis />
        <DitherLegend />
        <DitherTooltip labelKey="date" />
        <DitherBar dataKey="opened" variant="hatched" />
        <DitherBar dataKey="merged" variant="hatched" />
      </DitherBarChart>
    </div>
  )
}

export function DraftLatencyChart({ data }: { data: MetricsSnapshot['draftLatencySeries'] }) {
  return (
    <div className="aspect-auto h-72 w-full">
      <DitherLineChart data={data} config={draftLatencyConfig} bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="date" />
        <DitherYAxis />
        <DitherTooltip labelKey="date" />
        <DitherLine dataKey="avgHours" />
      </DitherLineChart>
    </div>
  )
}

export function LeadVsCycleChart({ data }: { data: MetricsSnapshot['leadVsCycleSeries'] }) {
  return (
    <div className="aspect-auto h-72 w-full">
      <DitherLineChart data={data} config={leadVsCycleConfig} bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="date" />
        <DitherYAxis />
        <DitherLegend />
        <DitherTooltip labelKey="date" />
        <DitherLine dataKey="leadHours" />
        <DitherLine dataKey="reviewCycleHours" />
      </DitherLineChart>
    </div>
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
    <div className="aspect-auto h-72 w-full">
      <DitherBarChart data={data} config={reviewStateMixConfig} stackType="stacked" bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="date" />
        <DitherYAxis />
        <DitherLegend />
        <DitherTooltip labelKey="date" />
        <DitherBar dataKey="approved" variant="hatched" />
        <DitherBar dataKey="changesRequested" variant="hatched" />
        <DitherBar dataKey="commented" variant="hatched" />
      </DitherBarChart>
    </div>
  )
}

export function AdditionsDeletionsChart({
  data,
}: {
  data: MetricsSnapshot['additionsDeletionsSeries']
}) {
  return (
    <div className="aspect-auto h-72 w-full">
      <DitherBarChart data={data} config={additionsDeletionsConfig} bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="date" />
        <DitherYAxis />
        <DitherLegend />
        <DitherTooltip labelKey="date" />
        <DitherBar dataKey="additions" variant="hatched" />
        <DitherBar dataKey="deletions" variant="hatched" />
      </DitherBarChart>
    </div>
  )
}

export function RoundsVsSizeChart({ data }: { data: MetricsSnapshot['roundsVsSize'] }) {
  const chart_data = data.map((row) => ({
    bucket: row.bucket,
    count: row.count,
    avgReviewRounds: row.avgReviewRounds != null ? Math.round(row.avgReviewRounds * 10) / 10 : 0,
  }))
  return (
    <div className="aspect-auto h-72 w-full">
      <DitherBarChart data={chart_data} config={roundsVsSizeConfig} bloom="off">
        <DitherGrid />
        <DitherXAxis dataKey="bucket" />
        <DitherYAxis />
        <DitherTooltip labelKey="bucket" />
        <DitherBar dataKey="avgReviewRounds" variant="hatched" />
      </DitherBarChart>
    </div>
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
