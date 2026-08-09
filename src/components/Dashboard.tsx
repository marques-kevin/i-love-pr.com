import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { MetricsSnapshot, MemberTeam, PeriodKey } from '@/lib/types'
import {
  CycleTimeChart,
  PRSizeChart,
  ReviewerChart,
  SizeReviewScatterChart,
  SizeVsReviewTimeChart,
  ThroughputChart,
  correlationInsight,
} from './Charts'
import { MemberFilter } from './MemberFilter'
import { OpenPRsList } from './OpenPRsList'

interface DashboardProps {
  repos: string[]
  selectedRepos: string[]
  onSelectedReposChange: (repos: string[]) => void
  contributors: string[]
  members: string[]
  onMembersChange: (members: string[]) => void
  teams: MemberTeam[]
  onSaveTeam: (name: string, members: string[], id?: string) => Promise<void>
  onDeleteTeam: (id: string) => Promise<void>
  periodKey: PeriodKey
  onPeriodKeyChange: (key: PeriodKey) => void
  customFrom: string
  customTo: string
  onCustomFromChange: (v: string) => void
  onCustomToChange: (v: string) => void
  metrics: MetricsSnapshot | null
  loading: boolean
  businessHoursEnabled?: boolean
}

function formatHours(h: number | null): string {
  if (h == null) return '—'
  if (h < 24) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

export function Dashboard({
  repos,
  selectedRepos,
  onSelectedReposChange,
  contributors,
  members,
  onMembersChange,
  teams,
  onSaveTeam,
  onDeleteTeam,
  periodKey,
  onPeriodKeyChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  metrics,
  loading,
  businessHoursEnabled = false,
}: DashboardProps) {
  function toggleRepo(repo: string) {
    if (selectedRepos.includes(repo)) {
      if (selectedRepos.length === 1) return
      onSelectedReposChange(selectedRepos.filter((r) => r !== repo))
    } else {
      onSelectedReposChange([...selectedRepos, repo])
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {repos.map((repo) => {
              const active = selectedRepos.includes(repo)
              return (
                <Button
                  key={repo}
                  type="button"
                  size="sm"
                  variant={active ? 'default' : 'outline'}
                  onClick={() => toggleRepo(repo)}
                >
                  {repo}
                </Button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              value={periodKey}
              onValueChange={(v) => onPeriodKeyChange(v as PeriodKey)}
            >
              <TabsList>
                {(['7d', '30d', '90d', 'custom'] as PeriodKey[]).map((key) => (
                  <TabsTrigger key={key} value={key}>
                    {key}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {periodKey === 'custom' && (
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => onCustomFromChange(e.target.value)}
                  className="w-auto"
                />
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => onCustomToChange(e.target.value)}
                  className="w-auto"
                />
              </div>
            )}
          </div>
        </div>

        <MemberFilter
          contributors={contributors}
          selected={members}
          onChange={onMembersChange}
          teams={teams}
          onSaveTeam={onSaveTeam}
          onDeleteTeam={onDeleteTeam}
        />
      </div>

      {loading && !metrics ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : !metrics ? (
        <p className="text-muted-foreground">
          No data yet. Run a sync to pull pull requests.
        </p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Stat label="Merged PRs" value={String(metrics.summary.mergedCount)} />
            <Stat
              label={businessHoursEnabled ? 'Avg cycle time (biz)' : 'Avg cycle time'}
              value={formatHours(metrics.summary.avgCycleTimeHours)}
            />
            <Stat
              label={
                businessHoursEnabled
                  ? 'Time to first review (biz)'
                  : 'Time to first review'
              }
              value={formatHours(metrics.summary.avgTimeToFirstReviewHours)}
            />
            <Stat
              label={
                businessHoursEnabled ? 'Request → approve (biz)' : 'Request → approve'
              }
              value={formatHours(metrics.summary.avgTimeToApproveHours)}
            />
            <Stat
              label="Avg PR size"
              value={
                metrics.summary.avgLinesChanged != null
                  ? `${Math.round(metrics.summary.avgLinesChanged)} lines`
                  : '—'
              }
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Panel title="Cycle time over time">
              <CycleTimeChart data={metrics.cycleTimeSeries} />
            </Panel>
            <Panel title="Throughput (merged / week)">
              <ThroughputChart data={metrics.throughput} />
            </Panel>
            <Panel title="PR size distribution">
              <PRSizeChart data={metrics.prSizeBuckets} />
            </Panel>
            <Panel title="Review load">
              <ReviewerChart data={metrics.reviewerLoad} />
            </Panel>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">
                Does PR size slow down review?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {correlationInsight(
                  metrics.sizeReviewCorrelation.linesVsTimeToApprove,
                  metrics.sizeReviewCorrelation.sampleSize,
                  'request → approve',
                )}
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel
                title="Avg review time by size"
                description="First human review vs time from review request to first approve."
              >
                <SizeVsReviewTimeChart data={metrics.sizeVsReviewTime} />
                <ul className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  {metrics.sizeVsReviewTime.map((row) => (
                    <li key={row.bucket}>
                      <span className="font-medium text-foreground">{row.bucket}</span>
                      {' · '}
                      n={row.count}
                      {row.avgHoursPerHundredLines != null && (
                        <>
                          {' · '}
                          {row.avgHoursPerHundredLines.toFixed(1)}h approve / 100 lines
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel
                title="Scatter: lines vs request → approve"
                description="Each point is a merged PR with at least one human APPROVED review."
              >
                {metrics.sizeReviewScatter.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No reviewed PRs in this period/filter.
                  </p>
                ) : (
                  <SizeReviewScatterChart data={metrics.sizeReviewScatter} />
                )}
              </Panel>
            </div>
          </section>

          <Panel title="Open pull requests">
            <OpenPRsList prs={metrics.openPrs} />
          </Panel>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}

function Panel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card className="bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
        {description && (
          <p className="text-sm font-normal text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
