import type { AppSettings, RepoSource } from '@/lib/types'

export function repo_source(settings: AppSettings, repo_full_name: string): RepoSource {
  return settings.repo_sources?.[repo_full_name] ?? 'pat'
}

export function merge_repo_sources_for_repos(
  existing: Record<string, RepoSource> | undefined,
  repos: string[],
) {
  const next: { [repo: string]: RepoSource } = {}
  for (const repo of repos) {
    next[repo] = existing?.[repo] ?? 'pat'
  }
  return next
}

export function mark_repo_source(
  existing: Record<string, RepoSource> | undefined,
  repo_full_name: string,
  source: RepoSource,
) {
  return { ...(existing ?? {}), [repo_full_name]: source } satisfies Record<string, RepoSource>
}

export function mark_new_pat_repos(
  existing: Record<string, RepoSource> | undefined,
  previous_repos: string[],
  next_repos: string[],
): Record<string, RepoSource> {
  const next = merge_repo_sources_for_repos(existing, next_repos)
  for (const repo of next_repos) {
    if (!previous_repos.includes(repo) && !existing?.[repo]) {
      next[repo] = 'pat'
    }
  }
  return next
}
