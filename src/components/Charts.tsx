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
  count: { label: 'PRs', color: 'var(--chart-1)' },
} satisfies ChartConfig

const throughputConfig = {
  count: { label: 'Merged PRs', color: 'var(--chart-3)' },
} satisfies ChartConfig

const reviewerConfig = {
  given: { label: 'Reviews given', color: 'var(--chart-1)' },
  received: { label: 'Reviews received', color: 'var(--chart-2)' },
} satisfies ChartConfig

const sizeVsReviewConfig = {
  avgTimeToFirstReviewHours: {
    label: 'First review (h)',
    color: 'var(--chart-1)',
  },
  avgTimeToApproveHours: {
    label: 'Request → approve (h)',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

const scatterConfig = {
  timeToApproveHours: {
    label: 'Request → approve (h)',
    color: 'var(--chart-1)',
  },
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
        />
      </LineChart>
    </ChartContainer>
  )
}

export function PRSizeChart({ data }: { data: MetricsSnapshot['prSizeBuckets'] }) {
  return (
    <ChartContainer config={sizeConfig} className="aspect-auto h-72 w-full">
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={6} />
      </BarChart>
    </ChartContainer>
  )
}

export function ReviewerChart({ data }: { data: MetricsSnapshot['reviewerLoad'] }) {
  return (
    <ChartContainer config={reviewerConfig} className="aspect-auto h-80 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="reviewer"
          width={96}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="given" fill="var(--color-given)" radius={4} />
        <Bar dataKey="received" fill="var(--color-received)" radius={4} />
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
        <Bar dataKey="count" fill="var(--color-count)" radius={6} />
      </BarChart>
    </ChartContainer>
  )
}

export function SizeVsReviewTimeChart({
  data,
}: {
  data: MetricsSnapshot['sizeVsReviewTime']
}) {
  const chartData = data.map((row) => ({
    ...row,
    avgTimeToFirstReviewHours:
      row.avgTimeToFirstReviewHours != null
        ? Math.round(row.avgTimeToFirstReviewHours * 10) / 10
        : 0,
    avgTimeToApproveHours:
      row.avgTimeToApproveHours != null
        ? Math.round(row.avgTimeToApproveHours * 10) / 10
        : 0,
  }))

  return (
    <ChartContainer config={sizeVsReviewConfig} className="aspect-auto h-72 w-full">
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
        />
        <Bar
          dataKey="avgTimeToApproveHours"
          fill="var(--color-avgTimeToApproveHours)"
          radius={4}
        />
      </BarChart>
    </ChartContainer>
  )
}

export function SizeReviewScatterChart({
  data,
}: {
  data: MetricsSnapshot['sizeReviewScatter']
}) {
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
            const p = payload[0].payload as MetricsSnapshot['sizeReviewScatter'][number] & {
              timeToApproveHours: number
            }
            return (
              <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                <p className="font-medium">
                  #{p.number} · {p.lines} lines
                </p>
                <p className="text-muted-foreground">
                  Request → approve: {p.timeToApproveHours.toFixed(1)}h
                  {p.timeToFirstReviewHours > 0 && (
                    <> · First review: {p.timeToFirstReviewHours.toFixed(1)}h</>
                  )}
                </p>
                <p className="truncate text-muted-foreground">{p.title}</p>
              </div>
            )
          }}
        />
        <Scatter
          data={points}
          fill="var(--color-timeToApproveHours)"
          fillOpacity={0.55}
        />
      </ScatterChart>
    </ChartContainer>
  )
}

export function correlationInsight(
  r: number | null,
  sampleSize: number,
  label = 'time to first review',
): string {
  if (r == null || sampleSize < 3) {
    return `Not enough approved PRs in this scope to correlate size with ${label}.`
  }
  const strength =
    Math.abs(r) < 0.2 ? 'weak / none' : Math.abs(r) < 0.5 ? 'moderate' : 'strong'
  const direction = r > 0.05 ? 'positive' : r < -0.05 ? 'negative' : 'flat'
  if (direction === 'flat') {
    return `Correlation ≈ ${r.toFixed(2)} (${strength}, n=${sampleSize}): PR size barely predicts ${label}.`
  }
  if (direction === 'positive') {
    return `Correlation ≈ ${r.toFixed(2)} (${strength} positive, n=${sampleSize}): larger PRs tend to take longer for ${label}.`
  }
  return `Correlation ≈ ${r.toFixed(2)} (${strength} negative, n=${sampleSize}): larger PRs are not slower for ${label} here.`
}
