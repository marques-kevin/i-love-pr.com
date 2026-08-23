import {
  differenceInCalendarDays,
  eachWeekOfInterval,
  format,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from 'date-fns'
import { isBotLogin } from './bots'
import { apply_test_file_line_filter } from './pr_line_adjustment'
import { DEFAULT_TEST_FILE_GLOBS } from './test_file_patterns'
import type {
  MetricsSnapshot,
  PeriodRange,
  PrChangedFileRecord,
  PrFactRecord,
  PullRequestRecord,
} from './types'
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

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Percentile for 0..1 (e.g. 0.5 = p50). Null if empty. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length === 1) return sorted[0]
  const idx = (sorted.length - 1) * Math.min(1, Math.max(0, p))
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function open_pr_age_bucket(age_days: number): string {
  if (age_days < 1) return '<1d'
  if (age_days < 3) return '1–3d'
  if (age_days < 7) return '3–7d'
  if (age_days < 14) return '7–14d'
  return '14d+'
}

const OPEN_AGE_BUCKET_ORDER = ['<1d', '1–3d', '3–7d', '7–14d', '14d+']
const REVIEW_ROUNDS_ORDER = ['0', '1', '2', '3', '4+']

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
  hide_test_files?: boolean
}): Promise<MetricsSnapshot> {
  const { repositories, repos, members, period, hide_test_files = false } = options
  const member_set = new Set(members)
  const has_member_filter = member_set.size > 0

  const repo_settings_by_repo = new Map(
    await Promise.all(
      repos.map(async (repo) => [repo, await repositories.repo_settings.get(repo)] as const),
    ),
  )

  let prs: PrFactRecord[] = await repositories.pr_facts.list_by_repos(repos)
  prs = prs.filter((pr) => !pr.is_bot)
  if (has_member_filter) {
    prs = prs.filter((pr) => member_set.has(pr.author))
  }

  if (hide_test_files && prs.length > 0) {
    const changed_files = await repositories.pr_changed_files.list_by_pr_ids(
      prs.map((pr) => pr.pr_id),
    )
    const files_by_pr = new Map<string, PrChangedFileRecord[]>()
    for (const file of changed_files) {
      const list = files_by_pr.get(file.pr_id) ?? []
      list.push(file)
      files_by_pr.set(file.pr_id, list)
    }
    prs = prs.map((pr) => {
      const files = files_by_pr.get(pr.pr_id) ?? []
      if (files.length === 0) return pr
      const test_file_globs =
        repo_settings_by_repo.get(pr.repo_full_name)?.test_file_globs ?? DEFAULT_TEST_FILE_GLOBS
      return apply_test_file_line_filter(pr, files, test_file_globs)
    })
  }

  const pr_by_id = new Map(prs.map((pr) => [pr.pr_id, pr]))
  const all_reviews = await repositories.reviews.list_by_pr_ids([...pr_by_id.keys()])
  const reviews = all_reviews.filter((r) => {
    if (!pr_by_id.has(r.pr_id)) return false
    const pr = pr_by_id.get(r.pr_id)!
    const ignored_bots = repo_settings_by_repo.get(pr.repo_full_name)?.ignored_bots ?? []
    return !isBotLogin(r.author, ignored_bots)
  })

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
      avgHours: hours.length ? round1(avg(hours) ?? 0) : 0,
      count: week_merged.length,
    }
  })

  const cycle_breakdown_series = weeks.map((week_start) => {
    const week_end = new Date(week_start)
    week_end.setDate(week_end.getDate() + 7)
    const week_merged = merged_in_period.filter((pr) => {
      const m = parseISO(pr.merged_at!)
      return m >= week_start && m < week_end
    })
    const create_to_ask: number[] = []
    const ask_to_first: number[] = []
    const first_to_approve: number[] = []
    const approve_to_merge: number[] = []
    for (const pr of week_merged) {
      const c = pr.cycle
      if (c.time_from_creation_to_asked_for_review != null) {
        create_to_ask.push(c.time_from_creation_to_asked_for_review)
      }
      if (c.time_from_asked_for_review_to_first_review != null) {
        ask_to_first.push(c.time_from_asked_for_review_to_first_review)
      }
      if (
        c.time_from_asked_for_review_to_approved != null &&
        c.time_from_asked_for_review_to_first_review != null
      ) {
        first_to_approve.push(
          Math.max(
            0,
            c.time_from_asked_for_review_to_approved - c.time_from_asked_for_review_to_first_review,
          ),
        )
      }
      if (c.time_from_creation_to_merged != null && c.time_from_creation_to_approved != null) {
        approve_to_merge.push(
          Math.max(0, c.time_from_creation_to_merged - c.time_from_creation_to_approved),
        )
      }
    }
    return {
      date: format(week_start, 'yyyy-MM-dd'),
      createToAskHours: round1(avg(create_to_ask) ?? 0),
      askToFirstReviewHours: round1(avg(ask_to_first) ?? 0),
      firstReviewToApproveHours: round1(avg(first_to_approve) ?? 0),
      approveToMergeHours: round1(avg(approve_to_merge) ?? 0),
      count: week_merged.length,
    }
  })

  const review_latency_series = weeks.map((week_start) => {
    const week_end = new Date(week_start)
    week_end.setDate(week_end.getDate() + 7)
    const week_merged = merged_in_period.filter((pr) => {
      const m = parseISO(pr.merged_at!)
      return m >= week_start && m < week_end
    })
    const tfr = week_merged
      .map((pr) => pr.cycle.time_from_asked_for_review_to_first_review)
      .filter((h): h is number => h != null)
    const approve = week_merged
      .map((pr) => pr.cycle.time_from_asked_for_review_to_approved)
      .filter((h): h is number => h != null)
    return {
      date: format(week_start, 'yyyy-MM-dd'),
      avgTimeToFirstReviewHours: round1(avg(tfr) ?? 0),
      avgTimeToApproveHours: round1(avg(approve) ?? 0),
      count: week_merged.length,
    }
  })

  const cycle_percentile_series = weeks.map((week_start) => {
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
      p50Hours: round1(percentile(hours, 0.5) ?? 0),
      p95Hours: round1(percentile(hours, 0.95) ?? 0),
      count: week_merged.length,
    }
  })

  const flow_volume_series = weeks.map((week_start) => {
    const week_end = new Date(week_start)
    week_end.setDate(week_end.getDate() + 7)
    const opened = prs.filter((pr) => {
      const created = parseISO(pr.created_at)
      return created >= week_start && created < week_end
    }).length
    const merged = merged_in_period.filter((pr) => {
      const m = parseISO(pr.merged_at!)
      return m >= week_start && m < week_end
    }).length
    return {
      date: format(week_start, 'yyyy-MM-dd'),
      opened,
      merged,
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

  const now = new Date()
  const open_age_counts = new Map<string, number>()
  for (const b of OPEN_AGE_BUCKET_ORDER) open_age_counts.set(b, 0)
  for (const pr of open_prs) {
    const age_days = Math.max(0, differenceInCalendarDays(now, parseISO(pr.created_at)))
    const bucket = open_pr_age_bucket(age_days)
    open_age_counts.set(bucket, (open_age_counts.get(bucket) ?? 0) + 1)
  }
  const open_pr_age_buckets = OPEN_AGE_BUCKET_ORDER.map((bucket) => ({
    bucket,
    count: open_age_counts.get(bucket) ?? 0,
  }))

  const rounds_counts = new Map<string, number>()
  for (const b of REVIEW_ROUNDS_ORDER) rounds_counts.set(b, 0)
  for (const pr of merged_in_period) {
    const key = pr.review_rounds >= 4 ? '4+' : String(pr.review_rounds)
    rounds_counts.set(key, (rounds_counts.get(key) ?? 0) + 1)
  }
  const review_rounds_buckets = REVIEW_ROUNDS_ORDER.map((rounds) => ({
    rounds,
    count: rounds_counts.get(rounds) ?? 0,
  }))

  const no_review_count = merged_in_period.filter((pr) => pr.review_rounds === 0).length
  const no_review_merges = {
    mergedCount: merged_in_period.length,
    noReviewCount: no_review_count,
    noReviewRatio: merged_in_period.length === 0 ? null : no_review_count / merged_in_period.length,
  }

  const by_author = new Map<string, PrFactRecord[]>()
  for (const pr of merged_in_period) {
    const list = by_author.get(pr.author) ?? []
    list.push(pr)
    by_author.set(pr.author, list)
  }
  const author_leaderboard = [...by_author.entries()]
    .map(([author, author_prs]) => {
      const cycles = author_prs
        .map((pr) => pr.cycle.time_from_creation_to_merged)
        .filter((h): h is number => h != null)
      return {
        author,
        mergedCount: author_prs.length,
        avgCycleTimeHours: avg(cycles),
        avgLinesChanged: avg(author_prs.map((pr) => pr.lines_changed)),
        avgReviewRounds: avg(author_prs.map((pr) => pr.review_rounds)),
      }
    })
    .sort((a, b) => b.mergedCount - a.mergedCount)
    .slice(0, 15)

  const draft_latency_series = weeks.map((week_start) => {
    const week_end = new Date(week_start)
    week_end.setDate(week_end.getDate() + 7)
    const week_merged = merged_in_period.filter((pr) => {
      const m = parseISO(pr.merged_at!)
      return m >= week_start && m < week_end
    })
    const hours = week_merged
      .map((pr) => pr.cycle.time_from_creation_to_asked_for_review)
      .filter((h): h is number => h != null)
    return {
      date: format(week_start, 'yyyy-MM-dd'),
      avgHours: round1(avg(hours) ?? 0),
      count: hours.length,
    }
  })

  const lead_vs_cycle_series = weeks.map((week_start) => {
    const week_end = new Date(week_start)
    week_end.setDate(week_end.getDate() + 7)
    const week_merged = merged_in_period.filter((pr) => {
      const m = parseISO(pr.merged_at!)
      return m >= week_start && m < week_end
    })
    const lead = week_merged
      .map((pr) => pr.cycle.time_from_creation_to_merged)
      .filter((h): h is number => h != null)
    const review_cycle = week_merged
      .map((pr) => pr.cycle.time_from_asked_for_review_to_approved)
      .filter((h): h is number => h != null)
    return {
      date: format(week_start, 'yyyy-MM-dd'),
      leadHours: round1(avg(lead) ?? 0),
      reviewCycleHours: round1(avg(review_cycle) ?? 0),
      count: week_merged.length,
    }
  })

  const by_repo = new Map<string, PrFactRecord[]>()
  for (const pr of merged_in_period) {
    const list = by_repo.get(pr.repo_full_name) ?? []
    list.push(pr)
    by_repo.set(pr.repo_full_name, list)
  }
  const repo_comparison = [...by_repo.entries()]
    .map(([repo, repo_prs]) => {
      const cycles = repo_prs
        .map((pr) => pr.cycle.time_from_creation_to_merged)
        .filter((h): h is number => h != null)
      return {
        repo,
        mergedCount: repo_prs.length,
        avgCycleTimeHours: avg(cycles),
        avgLinesChanged: avg(repo_prs.map((pr) => pr.lines_changed)),
      }
    })
    .sort((a, b) => b.mergedCount - a.mergedCount)

  const author_cycle_ranking = [...by_author.entries()]
    .map(([author, author_prs]) => {
      const cycles = author_prs
        .map((pr) => pr.cycle.time_from_creation_to_merged)
        .filter((h): h is number => h != null)
      const avg_cycle = avg(cycles)
      return avg_cycle == null
        ? null
        : {
            author,
            mergedCount: author_prs.length,
            avgCycleTimeHours: round1(avg_cycle),
          }
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort((a, b) => b.avgCycleTimeHours - a.avgCycleTimeHours)
    .slice(0, 15)

  const review_balance = reviewer_load
    .map((row) => ({
      person: row.reviewer,
      given: row.given,
      received: row.received,
      ratio: row.received === 0 ? null : round1(row.given / row.received),
    }))
    .sort((a, b) => (b.ratio ?? -1) - (a.ratio ?? -1))

  const review_state_mix_series = weeks.map((week_start) => {
    const week_end = new Date(week_start)
    week_end.setDate(week_end.getDate() + 7)
    let approved = 0
    let changes_requested = 0
    let commented = 0
    for (const review of reviews) {
      const submitted = parseISO(review.submitted_at)
      if (submitted < week_start || submitted >= week_end) continue
      const pr = pr_by_id.get(review.pr_id)
      if (!pr || review.author === pr.author) continue
      if (review.state === 'APPROVED') approved += 1
      else if (review.state === 'CHANGES_REQUESTED') changes_requested += 1
      else if (review.state === 'COMMENTED') commented += 1
    }
    return {
      date: format(week_start, 'yyyy-MM-dd'),
      approved,
      changesRequested: changes_requested,
      commented,
    }
  })

  const additions_deletions_series = weeks.map((week_start) => {
    const week_end = new Date(week_start)
    week_end.setDate(week_end.getDate() + 7)
    const week_merged = merged_in_period.filter((pr) => {
      const m = parseISO(pr.merged_at!)
      return m >= week_start && m < week_end
    })
    return {
      date: format(week_start, 'yyyy-MM-dd'),
      additions: week_merged.reduce((sum, pr) => sum + pr.lines_added, 0),
      deletions: week_merged.reduce((sum, pr) => sum + pr.lines_deleted, 0),
    }
  })

  const rounds_vs_size = BUCKET_ORDER.map((bucket) => {
    const in_bucket = merged_in_period.filter((pr) => size_bucket(pr.lines_changed) === bucket)
    return {
      bucket,
      count: in_bucket.length,
      avgReviewRounds: avg(in_bucket.map((pr) => pr.review_rounds)),
    }
  })

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
    cycleBreakdownSeries: cycle_breakdown_series,
    reviewLatencySeries: review_latency_series,
    cyclePercentileSeries: cycle_percentile_series,
    prSizeBuckets: pr_size_buckets,
    sizeVsReviewTime: size_vs_review_time,
    sizeReviewScatter: size_review_scatter,
    throughput,
    reviewerLoad: reviewer_load,
    reviewRoundsBuckets: review_rounds_buckets,
    noReviewMerges: no_review_merges,
    authorLeaderboard: author_leaderboard,
    openPrAgeBuckets: open_pr_age_buckets,
    flowVolumeSeries: flow_volume_series,
    draftLatencySeries: draft_latency_series,
    leadVsCycleSeries: lead_vs_cycle_series,
    repoComparison: repo_comparison,
    authorCycleRanking: author_cycle_ranking,
    reviewBalance: review_balance,
    reviewStateMixSeries: review_state_mix_series,
    additionsDeletionsSeries: additions_deletions_series,
    roundsVsSize: rounds_vs_size,
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
