import { is_json_object, is_string_value } from '@/lib/boundary_parse'
import type { JsonValue } from '@/lib/json_value'

export type RepoSource = 'pat' | 'import'

export type RepoSourcesByName = Record<string, RepoSource>

function is_repo_source(value: string): value is RepoSource {
  return value === 'pat' || value === 'import'
}

export function parse_repo_sources(value: JsonValue | undefined) {
  if (value === undefined || !is_json_object(value)) {
    return {} satisfies RepoSourcesByName
  }
  const entries: [string, RepoSource][] = []
  for (const [repo, source] of Object.entries(value)) {
    if (is_string_value(source) && is_repo_source(source)) {
      entries.push([repo, source])
    }
  }
  return Object.fromEntries(entries) satisfies RepoSourcesByName
}

/** Keep only repos in the list; default missing entries to PAT-added. */
export function normalize_repo_sources(repos: string[], existing: RepoSourcesByName = {}) {
  return Object.fromEntries(
    repos.map((repo): [string, RepoSource] => [repo, existing[repo] ?? 'pat']),
  ) satisfies RepoSourcesByName
}

/** Mark newly listed repos as PAT-added without overwriting import sources. */
export function merge_pat_repo_sources(repos: string[], existing: RepoSourcesByName = {}) {
  const next = normalize_repo_sources(repos, existing)
  for (const repo of repos) {
    if (!(repo in existing)) {
      next[repo] = 'pat'
    }
  }
  return next
}

export function mark_repo_imported(
  repos: string[],
  existing: RepoSourcesByName,
  repo_full_name: string,
) {
  return {
    ...merge_pat_repo_sources(repos, existing),
    [repo_full_name]: 'import',
  } satisfies RepoSourcesByName
}

export function repo_source_for(
  repo_full_name: string,
  repo_sources: RepoSourcesByName,
): RepoSource {
  return repo_sources[repo_full_name] ?? 'pat'
}
