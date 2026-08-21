export type RepoPathParts = {
  owner: string
  name: string
}

export function split_repo_full_name(repo_full_name: string): RepoPathParts {
  const slash = repo_full_name.indexOf('/')
  if (slash <= 0 || slash >= repo_full_name.length - 1) {
    return { owner: repo_full_name, name: repo_full_name }
  }
  return {
    owner: repo_full_name.slice(0, slash),
    name: repo_full_name.slice(slash + 1),
  }
}

export function repo_dashboard_path(repo_full_name: string): string {
  const { owner, name } = split_repo_full_name(repo_full_name)
  return `/r/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`
}

function decode_path_segment(segment: string): string | null {
  try {
    const decoded = decodeURIComponent(segment)
    return decoded.length > 0 ? decoded : null
  } catch {
    return null
  }
}

export function parse_repo_dashboard_path(pathname: string): string | null {
  const match = /^\/r\/([^/]+)\/([^/]+)\/?$/.exec(pathname)
  if (!match) return null
  const owner = decode_path_segment(match[1] ?? '')
  const name = decode_path_segment(match[2] ?? '')
  if (!owner || !name) return null
  return `${owner}/${name}`
}

export function is_known_repo(repo_full_name: string | null, repos: string[]): boolean {
  return repo_full_name !== null && repos.includes(repo_full_name)
}

export function active_repo_from_url_or_settings(
  pathname: string,
  settings_repos: string[],
  settings_active_repo: string | null,
): string | null {
  const url_repo = parse_repo_dashboard_path(pathname)
  if (is_known_repo(url_repo, settings_repos)) return url_repo
  if (settings_active_repo && settings_repos.includes(settings_active_repo)) {
    return settings_active_repo
  }
  return settings_repos[0] ?? null
}
