import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import { DEFAULT_BACKFILL_LIMIT } from '@/lib/db'
import { DEFAULT_DASHBOARD_ID, DEFAULT_DASHBOARD_LAYOUT } from '@/lib/dashboard_layout'
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'
import type {
  AppSettings,
  PullRequestRecord,
  ReviewRecord,
  SavedAccount,
  SyncState,
} from '@/lib/types'

export const DEMO_LOGIN = 'demo'
export const DEMO_REPO = 'acme/widgets'
export const DEMO_TOKEN = 'demo-token'

const DEMO_AUTHORS = ['alice', 'bob', 'carol', 'dave', 'eve'] as const
const DEMO_REVIEWERS = ['bob', 'carol', 'frank', 'grace'] as const

export function is_demo_mode(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true'
}

export function create_demo_account(): SavedAccount {
  return {
    login: DEMO_LOGIN,
    name: 'Demo User',
    email: 'demo@example.com',
    avatar_url: null,
    token: DEMO_TOKEN,
    last_used_at: new Date().toISOString(),
  }
}

function iso_days_ago(days: number, hour: number, minute = 0): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  date.setUTCHours(hour, minute, 0, 0)
  return date.toISOString()
}

function add_hours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString()
}

function build_demo_pull_requests(): PullRequestRecord[] {
  const prs: PullRequestRecord[] = []

  for (let index = 1; index <= 24; index += 1) {
    const days_ago = 2 + Math.floor(((index - 1) / 23) * 26)
    const created_at = iso_days_ago(days_ago, 8 + (index % 9), (index * 7) % 60)
    const review_requested_at = add_hours(created_at, index % 3 === 0 ? 12 : 1)
    const is_open = index % 7 === 0
    const merged_at = is_open ? null : add_hours(review_requested_at, 2 + (index % 36))
    const closed_at = is_open ? null : merged_at
    const author = DEMO_AUTHORS[index % DEMO_AUTHORS.length]

    prs.push({
      id: `${DEMO_REPO}#${index}`,
      repo_full_name: DEMO_REPO,
      number: index,
      title: `Demo PR #${index}: ${is_open ? 'Open change' : 'Shipped feature'}`,
      author,
      state: is_open ? 'OPEN' : 'MERGED',
      created_at,
      updated_at: merged_at ?? add_hours(created_at, 4),
      closed_at,
      merged_at,
      ready_for_review_at: review_requested_at,
      first_review_requested_at: review_requested_at,
      additions: 20 + index * 8,
      deletions: 2 + (index % 15),
      changed_files: 1 + (index % 6),
      commits_count: 1 + (index % 4),
      comments_count: index % 5,
      labels: index % 4 === 0 ? ['enhancement'] : [],
    })
  }

  return prs
}

function build_demo_reviews(pull_requests: PullRequestRecord[]): ReviewRecord[] {
  const reviews: ReviewRecord[] = []

  for (const pr of pull_requests) {
    if (pr.state === 'OPEN') continue

    const first_reviewer = DEMO_REVIEWERS[pr.number % DEMO_REVIEWERS.length]
    reviews.push({
      id: `${pr.id}:review:1`,
      pr_id: pr.id,
      repo_full_name: pr.repo_full_name,
      pr_number: pr.number,
      author: first_reviewer,
      state: pr.number % 5 === 0 ? 'CHANGES_REQUESTED' : 'APPROVED',
      submitted_at: add_hours(pr.first_review_requested_at ?? pr.created_at, 1 + (pr.number % 8)),
    })

    if (pr.number % 3 === 0) {
      const second_reviewer = DEMO_REVIEWERS[(pr.number + 1) % DEMO_REVIEWERS.length]
      reviews.push({
        id: `${pr.id}:review:2`,
        pr_id: pr.id,
        repo_full_name: pr.repo_full_name,
        pr_number: pr.number,
        author: second_reviewer,
        state: 'APPROVED',
        submitted_at: add_hours(
          pr.first_review_requested_at ?? pr.created_at,
          4 + (pr.number % 12),
        ),
      })
    }
  }

  return reviews
}

function build_demo_settings(): AppSettings {
  const now = new Date().toISOString()

  return {
    id: 'settings',
    token: DEMO_TOKEN,
    repos: [DEMO_REPO],
    active_repo: DEMO_REPO,
    sync_interval_hours: 24,
    backfill_limit: DEFAULT_BACKFILL_LIMIT,
    ignored_bots: [...DEFAULT_IGNORED_BOTS],
    test_file_globs: [...DEFAULT_TEST_FILE_GLOBS],
    teams: [
      {
        id: 'team-frontend',
        name: 'Frontend',
        members: ['alice', 'bob', 'carol'],
        created_at: now,
      },
    ],
    business_hours: DEFAULT_BUSINESS_HOURS,
    dashboards: [
      {
        id: DEFAULT_DASHBOARD_ID,
        name: '',
        repo_full_name: DEMO_REPO,
        layout: [...DEFAULT_DASHBOARD_LAYOUT],
        members: [],
        period_key: '30d',
        custom_from: '',
        custom_to: '',
        hide_test_files: false,
      },
    ],
    active_dashboard_id: DEFAULT_DASHBOARD_ID,
    active_dashboard_by_repo: { [DEMO_REPO]: DEFAULT_DASHBOARD_ID },
    locale: null,
    onboarded_at: now,
  }
}

function build_demo_sync_state(pull_request_count: number): SyncState {
  return {
    repo_full_name: DEMO_REPO,
    cursor_updated_at: iso_days_ago(1, 12),
    page_cursor: null,
    mode: 'idle',
    last_synced_at: iso_days_ago(1, 12),
    last_error: null,
    total_fetched: pull_request_count,
    backfill_fetched: pull_request_count,
    remote_oldest_created_at: iso_days_ago(28, 8),
  }
}

export function create_demo_seed() {
  const pull_requests = build_demo_pull_requests()
  const reviews = build_demo_reviews(pull_requests)

  return {
    settings: build_demo_settings(),
    pull_requests,
    reviews,
    sync_states: [build_demo_sync_state(pull_requests.length)],
  }
}
