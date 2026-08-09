export type GitHubTokenType = 'classic' | 'fine_grained' | 'unknown'

export type ScopeStatus = 'granted' | 'missing' | 'not_applicable'

export interface ScopeInfo {
  scope: string
  status: ScopeStatus
  required: boolean
  overly_permissive: boolean
}

export interface TokenScopeAnalysis {
  token_type: GitHubTokenType
  scopes: ScopeInfo[]
  granted_scopes: string[]
  has_required_access: boolean
  overly_permissive_scopes: string[]
  can_use_more_restrictive: boolean
}

/** Minimum scopes needed to read pull requests from repositories. */
export const REQUIRED_REPO_SCOPES = ['public_repo', 'repo'] as const

/**
 * Classic PAT scopes that exceed what iLovePR needs and should trigger a warning.
 * `repo` is not listed here — it is required for private repositories.
 */
export const OVERLY_PERMISSIVE_SCOPES = [
  'delete_repo',
  'admin:org',
  'admin:public_key',
  'admin:repo_hook',
  'admin:org_hook',
  'admin:enterprise',
  'write:packages',
  'delete:packages',
  'workflow',
  'gist',
  'notifications',
  'user',
  'write:discussion',
  'project',
] as const

/** Scopes shown in the onboarding UI with their requirement level. */
export const DISPLAYED_SCOPES = [
  { scope: 'public_repo', required: true },
  { scope: 'repo', required: false },
  { scope: 'read:user', required: false },
] as const

export function detect_token_type(token: string): GitHubTokenType {
  const trimmed = token.trim()
  if (trimmed.startsWith('github_pat_')) return 'fine_grained'
  if (trimmed.startsWith('ghp_') || trimmed.startsWith('gho_')) return 'classic'
  return 'unknown'
}

function expand_granted_scopes(granted: string[]): Set<string> {
  const set = new Set(granted)
  // Classic `repo` scope implicitly includes these sub-scopes.
  if (set.has('repo')) {
    set.add('public_repo')
    set.add('repo:status')
    set.add('repo_deployment')
    set.add('repo:invite')
  }
  return set
}

export function analyze_token_scopes(
  granted_scopes: string[],
  token_type: GitHubTokenType,
): TokenScopeAnalysis {
  if (token_type === 'fine_grained') {
    return {
      token_type,
      scopes: [],
      granted_scopes: [],
      has_required_access: true,
      overly_permissive_scopes: [],
      can_use_more_restrictive: false,
    }
  }

  const expanded = expand_granted_scopes(granted_scopes)
  const has_repo = expanded.has('repo')
  const has_public_repo = expanded.has('public_repo')
  const has_required_access = has_repo || has_public_repo
  const explicitly_granted_repo = granted_scopes.includes('repo')
  const explicitly_granted_public_repo = granted_scopes.includes('public_repo')

  const overly_permissive_scopes = granted_scopes.filter((scope) =>
    (OVERLY_PERMISSIVE_SCOPES as readonly string[]).includes(scope),
  )

  const scopes: ScopeInfo[] = DISPLAYED_SCOPES.map(({ scope, required }) => {
    const granted = expanded.has(scope)
    let status: ScopeStatus = granted ? 'granted' : 'missing'

    if (scope === 'public_repo' && explicitly_granted_repo && !explicitly_granted_public_repo) {
      status = 'not_applicable'
    }

    return {
      scope,
      status,
      required,
      overly_permissive: (OVERLY_PERMISSIVE_SCOPES as readonly string[]).includes(scope),
    }
  })

  return {
    token_type,
    scopes,
    granted_scopes,
    has_required_access,
    overly_permissive_scopes,
    can_use_more_restrictive:
      granted_scopes.includes('repo') && !granted_scopes.includes('public_repo'),
  }
}
