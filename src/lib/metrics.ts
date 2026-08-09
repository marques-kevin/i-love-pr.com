import { eachWeekOfInterval, format, isWithinInterval, parseISO, startOfWeek } from 'date-fns'
import { isBotLogin } from './bots'
import type { MetricsSnapshot, PeriodRange, PrFactRecord, PullRequestRecord } from './types'
import type { Repositories } from '@/repositories'

function in_period(iso: string | null | undefined, range: PeriodRange): boolean {
  if (!iso) return false
  const d = parseISO(iso)
  return isWithinInterval(d, { start: range.from, end: range.to })
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

/** Pearson correlation coefficient; null if fewer than 3 points or zero variance. */
function pearson(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length)
  if (n < 3) return null
  const mx = avg(xs.slice(0, n))!
  const my = avg(ys.slice(0, n))!
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    const vx = xs[i] - mx
    const vy = ys[i] - my
    num += vx * vy
    dx += vx * vx
    dy += vy * vy
  }
  if (dx === 0 || dy === 0) return null
  return num / Math.sqrt(dx * dy)
}

function size_bucket(lines: number): string {
  if (lines < 50) return 'XS (<50)'
  if (lines < 200) return 'S (50–199)'
  if (lines < 500) return 'M (200–499)'
  if (lines < 1000) return 'L (500–999)'
  return 'XL (1000+)'
}

const BUCKET_ORDER = ['XS (<50)', 'S (50–199)', 'M (200–499)', 'L (500–999)', 'XL (1000+)']

export async function compute_metrics(options: {
  repositories: Repositories
  repos: string[]
  members: string[]
  period: PeriodRange
}): Promise<MetricsSnapshot> {
  const { repositories, repos, members, period } = options
  const member_set = new Set(members)
  const has_member_filter = member_set.size > 0
  const settings = await repositories.settings.get()
  const ignored_bots = settings?.ignored_bots ?? []

  let prs: PrFactRecord[] = await repositories.pr_facts.list_by_repos(repos)
  prs = prs.filter((pr) => !pr.is_bot)
  if (has_member_filter) {
    prs = prs.filter((pr) => member_set.has(pr.author))
  }

  const pr_by_id = new Map(prs.map((pr) => [pr.pr_id, pr]))
  const all_reviews = await repositories.reviews.list_by_pr_ids([...pr_by_id.keys()])
  const reviews = all_reviews.filter(
    (r) => pr_by_id.has(r.pr_id) && !isBotLogin(r.author, ignored_bots),
  )

  const merged_in_period = prs.filter(
    (pr) => pr.state === 'MERGED' && in_period(pr.merged_at, period),
  )

  const created_or_updated_in_period = prs.filter(
    (pr) => in_period(pr.created_at, period) || in_period(pr.merged_at, period),
  )

  const weeks = eachWeekOfInterval({ start: period.from, end: period.to }, { weekStartsOn: 1 })
  const cycle_time_series = weeks.map((week_start) => {
    const week_end = new Date(week_start)
    week_end.setDate(week_end.getDate() + 7)
    const week_merged = merged_in_period.filter((pr) => {
      const m = parseISO(pr.merged_at!)
      return m >= week_start && m < week_end
    })
    const hours = week_merged
      .map((pr) => pr.cycle.time_from_creation_to_merged)
      .filter((h): h is number => h != null)
    return {
      date: format(week_start, 'yyyy-MM-dd'),
      avgHours: hours.length ? Math.round((avg(hours) ?? 0) * 10) / 10 : 0,
      count: week_merged.length,
    }
  })

  const bucket_counts = new Map<string, number>()
  for (const b of BUCKET_ORDER) bucket_counts.set(b, 0)
  for (const pr of merged_in_period.length ? merged_in_period : created_or_updated_in_period) {
    const b = size_bucket(pr.lines_changed)
    bucket_counts.set(b, (bucket_counts.get(b) ?? 0) + 1)
  }
  const pr_size_buckets = BUCKET_ORDER.map((bucket) => ({
    bucket,
    count: bucket_counts.get(bucket) ?? 0,
  }))

  const size_vs_review_time = BUCKET_ORDER.map((bucket) => {
    const in_bucket = merged_in_period.filter((pr) => size_bucket(pr.lines_changed) === bucket)
    const tfr = in_bucket
      .map((pr) => pr.cycle.time_from_asked_for_review_to_first_review)
      .filter((h): h is number => h != null)
    const to_approve = in_bucket
      .map((pr) => pr.cycle.time_from_asked_for_review_to_approved)
      .filter((h): h is number => h != null)
    const cycle = in_bucket
      .map((pr) => pr.cycle.time_from_creation_to_merged)
      .filter((h): h is number => h != null)
    const per_hundred = in_bucket
      .filter(
        (pr) => pr.cycle.time_from_asked_for_review_to_approved != null && pr.lines_changed > 0,
      )
      .map((pr) => (pr.cycle.time_from_asked_for_review_to_approved! / pr.lines_changed) * 100)
    return {
      bucket,
      count: in_bucket.length,
      avgTimeToFirstReviewHours: avg(tfr),
      avgTimeToApproveHours: avg(to_approve),
      avgCycleTimeHours: avg(cycle),
      avgHoursPerHundredLines: avg(per_hundred),
    }
  })

  const size_review_scatter = merged_in_period
    .filter((pr) => pr.cycle.time_from_asked_for_review_to_approved != null && pr.lines_changed > 0)
    .map((pr) => ({
      lines: pr.lines_changed,
      timeToFirstReviewHours: pr.cycle.time_from_asked_for_review_to_first_review ?? 0,
      timeToApproveHours: pr.cycle.time_from_asked_for_review_to_approved,
      cycleTimeHours: pr.cycle.time_from_creation_to_merged,
      number: pr.pr_number,
      title: pr.title,
      repoFullName: pr.repo_full_name,
    }))

  const approved_scatter = size_review_scatter.filter(
    (p): p is typeof p & { timeToApproveHours: number } => p.timeToApproveHours != null,
  )

  const size_review_correlation = {
    linesVsTimeToFirstReview: pearson(
      merged_in_period
        .filter((pr) => pr.cycle.time_from_asked_for_review_to_first_review != null)
        .map((pr) => pr.lines_changed),
      merged_in_period
        .filter((pr) => pr.cycle.time_from_asked_for_review_to_first_review != null)
        .map((pr) => pr.cycle.time_from_asked_for_review_to_first_review!),
    ),
    linesVsTimeToApprove: pearson(
      approved_scatter.map((p) => p.lines),
      approved_scatter.map((p) => p.timeToApproveHours),
    ),
    sampleSize: approved_scatter.length,
  }

  const throughput_map = new Map<string, number>()
  for (const pr of merged_in_period) {
    const week = format(startOfWeek(parseISO(pr.merged_at!), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const key = `${week}||${pr.author}`
    throughput_map.set(key, (throughput_map.get(key) ?? 0) + 1)
  }
  const throughput = [...throughput_map.entries()]
    .map(([key, count]) => {
      const [period_key, author] = key.split('||')
      return { period: period_key, author, count }
    })
    .sort((a, b) => a.period.localeCompare(b.period))

  const given = new Map<string, number>()
  const received = new Map<string, number>()

  for (const review of reviews) {
    if (!in_period(review.submitted_at, period)) continue
    const pr = pr_by_id.get(review.pr_id)
    if (!pr) continue
    if (review.author === pr.author) continue

    if (has_member_filter && !member_set.has(review.author) && !member_set.has(pr.author)) {
      continue
    }

    if (!has_member_filter || member_set.has(review.author)) {
      given.set(review.author, (given.get(review.author) ?? 0) + 1)
    }
    if (!has_member_filter || member_set.has(pr.author)) {
      received.set(pr.author, (received.get(pr.author) ?? 0) + 1)
    }
  }

  const people = new Set<string>([...given.keys(), ...received.keys()])
  if (!has_member_filter) {
    for (const pr of merged_in_period) people.add(pr.author)
  } else {
    for (const m of member_set) people.add(m)
  }

  const reviewer_load = [...people]
    .map((person) => ({
      reviewer: person,
      given: given.get(person) ?? 0,
      received: received.get(person) ?? 0,
    }))
    .filter((r) => r.given > 0 || r.received > 0)
    .sort((a, b) => b.given + b.received - (a.given + a.received))
    .slice(0, 20)

  const open_prs = prs
    .filter((pr) => pr.state === 'OPEN')
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  const cycle_hours = merged_in_period
    .map((pr) => pr.cycle.time_from_creation_to_merged)
    .filter((h): h is number => h != null)
  const tfr_hours = merged_in_period
    .map((pr) => pr.cycle.time_from_asked_for_review_to_first_review)
    .filter((h): h is number => h != null)
  const approve_hours = merged_in_period
    .map((pr) => pr.cycle.time_from_asked_for_review_to_approved)
    .filter((h): h is number => h != null)
  const rounds = merged_in_period.map((pr) => pr.review_rounds)
  const lines = merged_in_period.map((pr) => pr.lines_changed)

  return {
    cycleTimeSeries: cycle_time_series,
    prSizeBuckets: pr_size_buckets,
    sizeVsReviewTime: size_vs_review_time,
    sizeReviewScatter: size_review_scatter,
    sizeReviewCorrelation: size_review_correlation,
    throughput,
    reviewerLoad: reviewer_load,
    openPrs: open_prs,
    summary: {
      mergedCount: merged_in_period.length,
      avgCycleTimeHours: avg(cycle_hours),
      avgTimeToFirstReviewHours: avg(tfr_hours),
      avgTimeToApproveHours: avg(approve_hours),
      avgReviewRounds: avg(rounds),
      avgLinesChanged: avg(lines),
    },
  }
}

export async function list_contributors(
  repositories: Repositories,
  repos: string[],
): Promise<string[]> {
  const settings = await repositories.settings.get()
  const ignored_bots = settings?.ignored_bots ?? []

  const facts = repos.length > 0 ? await repositories.pr_facts.list_by_repos(repos) : []
  const set = new Set<string>()
  for (const pr of facts) {
    if (!pr.is_bot) set.add(pr.author)
  }
  const reviews = repos.length === 0 ? [] : await repositories.reviews.list_by_repos(repos)
  for (const r of reviews) {
    if (!isBotLogin(r.author, ignored_bots)) set.add(r.author)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

export { size_bucket, BUCKET_ORDER }
export type { PullRequestRecord }
