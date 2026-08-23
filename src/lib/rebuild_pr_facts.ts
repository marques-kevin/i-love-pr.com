import { create_elapsed_hours_fn } from '@/lib/business-hours'
import { enrichPullRequest, reviewWaitStartAt } from '@/lib/derive'
import { load_repo_analysis_settings } from '@/lib/repo_settings'
import { PR_FACTS_VERSION, type PrFactRecord, type PullRequestRecord } from '@/lib/types'
import type { Repositories } from '@/repositories'

export function pr_to_fact_record(
  pr: PullRequestRecord,
  reviews: Parameters<typeof enrichPullRequest>[1],
  ignored_bots: string[],
  business_hours: Parameters<typeof enrichPullRequest>[3],
  elapsed?: Parameters<typeof enrichPullRequest>[4],
): PrFactRecord {
  const elapsed_fn = elapsed ?? create_elapsed_hours_fn(business_hours)
  const enriched = enrichPullRequest(pr, reviews, ignored_bots, business_hours, elapsed_fn)
  const request_review_at = reviewWaitStartAt(pr)

  const time_from_creation_to_asked_for_review =
    request_review_at === pr.created_at
      ? 0
      : Math.max(0, elapsed_fn(pr.created_at, request_review_at))

  const time_from_creation_to_approved =
    enriched.first_approved_at != null
      ? Math.max(0, elapsed_fn(pr.created_at, enriched.first_approved_at))
      : null

  return {
    _version: PR_FACTS_VERSION,
    pr_id: enriched.id,
    repo_full_name: enriched.repo_full_name,
    author: enriched.author,
    state: enriched.state,
    created_at: enriched.created_at,
    merged_at: enriched.merged_at,
    pr_number: enriched.number,
    title: enriched.title,
    request_review_at,
    first_approved_at: enriched.first_approved_at,
    is_bot: enriched.is_bot,
    lines_added: pr.additions,
    lines_deleted: pr.deletions,
    lines_changed: enriched.lines_changed,
    review_rounds: enriched.review_rounds,
    cycle: {
      time_from_creation_to_asked_for_review,
      time_from_creation_to_merged: enriched.cycle_time_hours,
      time_from_creation_to_approved,
      time_from_asked_for_review_to_approved: enriched.time_to_approve_hours,
      time_from_asked_for_review_to_first_review: enriched.time_to_first_review_hours,
    },
  }
}

export async function rebuild_pr_facts_for_prs(
  repositories: Repositories,
  prs: PullRequestRecord[],
): Promise<void> {
  if (prs.length === 0) return
  const repo_full_names = [...new Set(prs.map((pr) => pr.repo_full_name))]
  const settings_by_repo = await load_repo_analysis_settings(repositories, repo_full_names)
  const elapsed_by_repo = new Map(
    repo_full_names.map((repo_full_name) => {
      const settings = settings_by_repo.get(repo_full_name)
      return [repo_full_name, create_elapsed_hours_fn(settings?.business_hours)]
    }),
  )

  const reviews = await repositories.reviews.list_by_pr_ids(prs.map((pr) => pr.id))
  const reviews_by_pr = new Map<string, typeof reviews>()
  for (const review of reviews) {
    const list = reviews_by_pr.get(review.pr_id) ?? []
    list.push(review)
    reviews_by_pr.set(review.pr_id, list)
  }

  const facts = prs.map((pr) => {
    const settings = settings_by_repo.get(pr.repo_full_name)
    return pr_to_fact_record(
      pr,
      reviews_by_pr.get(pr.id) ?? [],
      settings?.ignored_bots ?? [],
      settings?.business_hours,
      elapsed_by_repo.get(pr.repo_full_name),
    )
  })
  await repositories.pr_facts.put_many(facts)
}

export async function rebuild_pr_facts_for_repos(
  repositories: Repositories,
  repos: string[],
): Promise<void> {
  if (repos.length === 0) return
  const prs = await repositories.pull_requests.list_by_repos(repos)
  await repositories.pr_facts.delete_by_repos(repos)
  await rebuild_pr_facts_for_prs(repositories, prs)
}

export async function rebuild_all_pr_facts(repositories: Repositories): Promise<void> {
  const settings = await repositories.settings.get()
  const repos = settings?.repos ?? []
  if (repos.length === 0) {
    await repositories.pr_facts.clear()
    return
  }
  await rebuild_pr_facts_for_repos(repositories, repos)
}

/**
 * Rebuild when PR count diverges, or any fact row is on an older `_version`.
 */
export async function ensure_pr_facts(repositories: Repositories): Promise<void> {
  const settings = await repositories.settings.get()
  const repos = settings?.repos ?? []
  if (repos.length === 0) return

  let pr_count = 0
  for (const repo of repos) {
    pr_count += await repositories.pull_requests.count_by_repo(repo)
  }
  const facts = await repositories.pr_facts.list_by_repos(repos)
  const stale_version = facts.some((f) => f._version !== PR_FACTS_VERSION)
  if (pr_count > 0 && (facts.length !== pr_count || stale_version)) {
    await rebuild_pr_facts_for_repos(repositories, repos)
  }
}
