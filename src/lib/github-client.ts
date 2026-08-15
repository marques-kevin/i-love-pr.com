import { detect_token_type, type GitHubTokenType } from './github_token_scopes'
import { graphql_variable_object, is_external_object, is_string_value } from './boundary_parse'
import type { ExternalObject, ExternalValue, GraphQLVariableObject } from './json_value'
import type { NormalizedPullRequest, PrState, RateLimitInfo, ReviewState } from './types'

const REST_API_URL = 'https://api.github.com'

const GRAPHQL_URL = 'https://api.github.com/graphql'

export class GitHubApiError extends Error {
  status: number
  rateLimit: RateLimitInfo | null
  isSecondaryRateLimit: boolean

  constructor(
    message: string,
    status: number,
    rateLimit: RateLimitInfo | null = null,
    isSecondaryRateLimit = false,
  ) {
    super(message)
    this.name = 'GitHubApiError'
    this.status = status
    this.rateLimit = rateLimit
    this.isSecondaryRateLimit = isSecondaryRateLimit
  }
}

interface GraphQLResponse<T> {
  data?: T
  errors?: { message: string; type?: string }[]
}

interface PullRequestsPageData {
  rateLimit: {
    remaining: number
    limit: number
    resetAt: string
    cost: number
  }
  viewer?: { login: string }
  repository: {
    pullRequests: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      nodes: GraphQLPullRequest[]
    }
  } | null
}

interface GraphQLPullRequest {
  number: number
  title: string
  state: 'OPEN' | 'CLOSED' | 'MERGED'
  createdAt: string
  updatedAt: string
  closedAt: string | null
  mergedAt: string | null
  additions: number
  deletions: number
  changedFiles: number
  author: { login: string } | null
  labels: { nodes: { name: string }[] }
  commits: { totalCount: number }
  comments: { totalCount: number }
  reviews: {
    nodes: {
      id: string
      author: { login: string } | null
      state: ReviewState
      submittedAt: string | null
    }[]
  }
  timelineItems: {
    nodes: ({ __typename?: string; createdAt: string } | Record<string, never>)[]
  }
  files: {
    nodes: {
      path: string
      additions: number
      deletions: number
    }[]
  }
}

const PULL_REQUESTS_QUERY = `
  query FetchPullRequests($owner: String!, $name: String!, $cursor: String) {
    rateLimit {
      remaining
      limit
      resetAt
      cost
    }
    repository(owner: $owner, name: $name) {
      pullRequests(first: 25, after: $cursor, orderBy: { field: UPDATED_AT, direction: DESC }) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          number
          title
          state
          createdAt
          updatedAt
          closedAt
          mergedAt
          additions
          deletions
          changedFiles
          author {
            login
          }
          labels(first: 20) {
            nodes {
              name
            }
          }
          commits {
            totalCount
          }
          comments {
            totalCount
          }
          reviews(first: 100) {
            nodes {
              id
              author {
                login
              }
              state
              submittedAt
            }
          }
          timelineItems(first: 20, itemTypes: [READY_FOR_REVIEW_EVENT, REVIEW_REQUESTED_EVENT]) {
            nodes {
              __typename
              ... on ReadyForReviewEvent {
                createdAt
              }
              ... on ReviewRequestedEvent {
                createdAt
              }
            }
          }
          files(first: 100) {
            nodes {
              path
              additions
              deletions
            }
          }
        }
      }
    }
  }
`

const VALIDATE_TOKEN_QUERY = `
  query ValidateToken {
    rateLimit {
      remaining
      limit
      resetAt
      cost
    }
    viewer {
      login
      name
      avatarUrl
    }
  }
`

const LIST_REPOSITORIES_QUERY = `
  query ListRepositories($cursor: String) {
    rateLimit {
      remaining
      limit
      resetAt
      cost
    }
    viewer {
      repositories(
        first: 100
        after: $cursor
        affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]
        ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          nameWithOwner
          isPrivate
        }
      }
    }
  }
`

const RESOLVE_REPOSITORY_QUERY = `
  query ResolveRepository($owner: String!, $name: String!) {
    rateLimit {
      remaining
      limit
      resetAt
      cost
    }
    repository(owner: $owner, name: $name) {
      nameWithOwner
      isPrivate
    }
  }
`

const OLDEST_PULL_REQUEST_QUERY = `
  query OldestPullRequest($owner: String!, $name: String!) {
    rateLimit {
      remaining
      limit
      resetAt
      cost
    }
    repository(owner: $owner, name: $name) {
      pullRequests(first: 1, orderBy: { field: CREATED_AT, direction: ASC }) {
        nodes {
          createdAt
        }
      }
    }
  }
`

export interface GitHubRepoOption {
  fullName: string
  isPrivate: boolean
}

type GraphQLRateLimit = {
  remaining: number
  limit: number
  resetAt: string
  cost?: number
}

function to_rate_limit_info(rl: GraphQLRateLimit): RateLimitInfo {
  return {
    remaining: rl.remaining,
    limit: rl.limit,
    reset_at: rl.resetAt,
    cost: rl.cost,
  }
}

function parseRateLimitFromHeaders(headers: Headers): RateLimitInfo | null {
  const remaining = headers.get('x-ratelimit-remaining')
  const limit = headers.get('x-ratelimit-limit')
  const reset = headers.get('x-ratelimit-reset')
  if (remaining == null || limit == null || reset == null) return null
  return {
    remaining: Number(remaining),
    limit: Number(limit),
    reset_at: new Date(Number(reset) * 1000).toISOString(),
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class GitHubClient {
  private token: string
  private lastRateLimit: RateLimitInfo | null = null
  private minRemainingBeforeThrottle = 50

  constructor(token: string) {
    this.token = token
  }

  getRateLimit(): RateLimitInfo | null {
    return this.lastRateLimit
  }

  async validateToken(): Promise<{
    login: string
    name: string | null
    email: string | null
    avatar_url: string | null
    rateLimit: RateLimitInfo
  }> {
    const data = await this.graphql<{
      rateLimit: GraphQLRateLimit & { cost: number }
      viewer: {
        login: string
        name: string | null
        avatarUrl: string | null
      }
    }>(VALIDATE_TOKEN_QUERY)
    return {
      login: data.viewer.login,
      name: data.viewer.name,
      email: null,
      avatar_url: data.viewer.avatarUrl,
      rateLimit: to_rate_limit_info(data.rateLimit),
    }
  }

  /** Inspect OAuth scopes granted to a classic personal access token. */
  async inspectTokenScopes(): Promise<{
    scopes: string[]
    token_type: GitHubTokenType
    login: string | null
    rate_limit: RateLimitInfo | null
  }> {
    const token_type = detect_token_type(this.token)
    if (token_type === 'fine_grained') {
      return { scopes: [], token_type, login: null, rate_limit: null }
    }

    const response = await fetch(`${REST_API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github+json',
      },
    })

    const header_rate_limit = parseRateLimitFromHeaders(response.headers)
    if (header_rate_limit) this.lastRateLimit = header_rate_limit

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new GitHubApiError(
        `GitHub API error ${response.status}: ${text.slice(0, 200)}`,
        response.status,
        this.lastRateLimit,
      )
    }

    const body: ExternalValue = await response.json()
    const login = is_external_object(body) && is_string_value(body.login) ? body.login : null

    const scopes_header = response.headers.get('x-oauth-scopes') ?? ''
    const scopes = scopes_header
      .split(',')
      .map((scope) => scope.trim())
      .filter(Boolean)

    return { scopes, token_type, login, rate_limit: header_rate_limit }
  }

  /** List repositories accessible with the current token (paginated, capped). */
  async listRepositories(options?: {
    maxPages?: number
  }): Promise<{ repos: GitHubRepoOption[]; rateLimit: RateLimitInfo | null }> {
    const maxPages = options?.maxPages ?? 5
    const repos: GitHubRepoOption[] = []
    let cursor: string | null = null
    let page = 0

    type ListReposData = {
      rateLimit: GraphQLRateLimit & { cost: number }
      viewer: {
        repositories: {
          pageInfo: { hasNextPage: boolean; endCursor: string | null }
          nodes: { nameWithOwner: string; isPrivate: boolean }[]
        }
      }
    }

    while (page < maxPages) {
      const data: ListReposData = await this.graphql<ListReposData>(LIST_REPOSITORIES_QUERY, {
        cursor,
      })

      for (const node of data.viewer.repositories.nodes) {
        if (!node?.nameWithOwner) continue
        repos.push({
          fullName: node.nameWithOwner,
          isPrivate: node.isPrivate,
        })
      }

      page += 1
      if (!data.viewer.repositories.pageInfo.hasNextPage) break
      cursor = data.viewer.repositories.pageInfo.endCursor
      if (!cursor) break
    }

    repos.sort((a, b) => a.fullName.localeCompare(b.fullName))
    return { repos, rateLimit: this.lastRateLimit }
  }

  /** Resolve a public or accessible repo by owner/name (for manual add). */
  async resolveRepository(owner: string, name: string): Promise<GitHubRepoOption> {
    const data = await this.graphql<{
      rateLimit: GraphQLRateLimit & { cost: number }
      repository: { nameWithOwner: string; isPrivate: boolean } | null
    }>(RESOLVE_REPOSITORY_QUERY, { owner, name })

    if (!data.repository) {
      throw new GitHubApiError(
        `Repository ${owner}/${name} not found or inaccessible with this token`,
        404,
        this.lastRateLimit,
      )
    }

    return {
      fullName: data.repository.nameWithOwner,
      isPrivate: data.repository.isPrivate,
    }
  }

  /**
   * Probe the oldest pull request by createdAt ASC (cheap single-node query).
   * Used as the left-hand target for sync-depth progress.
   */
  async fetchOldestPullRequestCreatedAt(
    owner: string,
    name: string,
  ): Promise<{ created_at: string | null; rateLimit: RateLimitInfo }> {
    type OldestPullRequestData = {
      rateLimit: GraphQLRateLimit & { cost: number }
      repository: {
        pullRequests: {
          nodes: { createdAt: string }[]
        }
      } | null
    }

    const data = await this.graphql<OldestPullRequestData>(OLDEST_PULL_REQUEST_QUERY, {
      owner,
      name,
    })

    if (!data.repository) {
      throw new GitHubApiError(
        `Repository ${owner}/${name} not found or inaccessible`,
        404,
        this.lastRateLimit,
      )
    }

    return {
      created_at: data.repository.pullRequests.nodes[0]?.createdAt ?? null,
      rateLimit: this.lastRateLimit!,
    }
  }

  /**
   * Fetch one page of pull requests ordered by updatedAt DESC.
   * Callers drive pagination via pageCursor and stop when they hit their sync cursor.
   */
  async fetchPullRequestsPage(
    owner: string,
    name: string,
    pageCursor: string | null = null,
  ): Promise<{
    items: NormalizedPullRequest[]
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    rateLimit: RateLimitInfo
  }> {
    const data = await this.graphql<PullRequestsPageData>(PULL_REQUESTS_QUERY, {
      owner,
      name,
      cursor: pageCursor,
    })

    if (!data.repository) {
      throw new GitHubApiError(
        `Repository ${owner}/${name} not found or inaccessible`,
        404,
        this.lastRateLimit,
      )
    }

    const repoFullName = `${owner}/${name}`
    const items = data.repository.pullRequests.nodes.map((node) =>
      normalizePullRequest(node, repoFullName),
    )

    return {
      items,
      pageInfo: data.repository.pullRequests.pageInfo,
      rateLimit: this.lastRateLimit!,
    }
  }

  private async graphql<T>(
    query: string,
    variables: GraphQLVariableObject = graphql_variable_object(),
    attempt = 0,
  ): Promise<T> {
    await this.maybeThrottle()

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    })

    const headerRateLimit = parseRateLimitFromHeaders(response.headers)
    if (headerRateLimit) this.lastRateLimit = headerRateLimit

    const retryAfter = response.headers.get('retry-after')

    if (response.status === 403 || response.status === 429) {
      const bodyText = await response.text().catch(() => '')
      const isSecondary =
        Boolean(retryAfter) ||
        /secondary rate limit/i.test(bodyText) ||
        response.headers.get('x-ratelimit-remaining') === '0'

      if (attempt < 5) {
        const backoffMs = retryAfter
          ? Number(retryAfter) * 1000
          : Math.min(60_000, 1000 * 2 ** attempt)
        await sleep(backoffMs)
        return this.graphql(query, variables, attempt + 1)
      }
      throw new GitHubApiError(
        'GitHub rate limit exceeded',
        response.status,
        this.lastRateLimit,
        isSecondary,
      )
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new GitHubApiError(
        `GitHub API error ${response.status}: ${text.slice(0, 200)}`,
        response.status,
        this.lastRateLimit,
      )
    }

    const raw: ExternalValue = await response.json()
    if (!is_external_object(raw)) {
      throw new GitHubApiError('Invalid GraphQL response', 500, this.lastRateLimit)
    }
    const payload = parse_graphql_payload<T>(raw)

    if (payload.data && 'rateLimit' in payload.data && payload.data.rateLimit) {
      this.lastRateLimit = to_rate_limit_info(payload.data.rateLimit)
    }

    if (payload.errors?.length) {
      const message = payload.errors.map((e) => e.message).join('; ')
      const isRate = /rate limit/i.test(message)
      if (isRate && attempt < 5) {
        const resetMs = this.lastRateLimit
          ? Math.max(0, new Date(this.lastRateLimit.reset_at).getTime() - Date.now())
          : 1000 * 2 ** attempt
        await sleep(Math.min(resetMs || 1000, 60_000))
        return this.graphql(query, variables, attempt + 1)
      }
      throw new GitHubApiError(message, isRate ? 403 : 400, this.lastRateLimit, isRate)
    }

    if (!payload.data) {
      throw new GitHubApiError('Empty GraphQL response', 500, this.lastRateLimit)
    }

    return payload.data
  }

  private async maybeThrottle(): Promise<void> {
    if (!this.lastRateLimit) return
    if (this.lastRateLimit.remaining > this.minRemainingBeforeThrottle) return

    const resetMs = new Date(this.lastRateLimit.reset_at).getTime() - Date.now()
    if (resetMs <= 0) return

    // Soft throttle: wait a bit when approaching the limit
    const wait = Math.min(resetMs, 5_000)
    await sleep(wait)
  }
}

function normalizePullRequest(
  node: GraphQLPullRequest,
  repo_full_name: string,
): NormalizedPullRequest {
  const author = node.author?.login ?? 'unknown'
  const timeline = node.timelineItems.nodes.filter(
    (n): n is { __typename?: string; createdAt: string } =>
      'createdAt' in n && is_string_value(n.createdAt),
  )

  const readyEvent = timeline.find((n) => n.__typename === 'ReadyForReviewEvent')
  const reviewRequestedTimes = timeline
    .filter((n) => n.__typename === 'ReviewRequestedEvent')
    .map((n) => n.createdAt)
    .sort()

  const state: PrState = node.state
  const pull_request = {
    id: `${repo_full_name}#${node.number}`,
    repo_full_name,
    number: node.number,
    title: node.title,
    author,
    state,
    created_at: node.createdAt,
    updated_at: node.updatedAt,
    closed_at: node.closedAt,
    merged_at: node.mergedAt,
    ready_for_review_at: readyEvent?.createdAt ?? null,
    first_review_requested_at: reviewRequestedTimes[0] ?? null,
    additions: node.additions,
    deletions: node.deletions,
    changed_files: node.changedFiles,
    commits_count: node.commits.totalCount,
    comments_count: node.comments.totalCount,
    labels: node.labels.nodes.map((l) => l.name),
  }

  const reviews = node.reviews.nodes
    .filter((r) => r.submittedAt)
    .map((r) => ({
      id: r.id,
      pr_id: pull_request.id,
      repo_full_name,
      pr_number: node.number,
      author: r.author?.login ?? 'unknown',
      state: r.state,
      submitted_at: r.submittedAt!,
    }))

  const changed_files = node.files.nodes.map((file) => ({
    id: `${pull_request.id}:${file.path}`,
    pr_id: pull_request.id,
    path: file.path,
    additions: file.additions,
    deletions: file.deletions,
  }))

  return { pull_request, reviews, changed_files }
}

export function parseRepoFullName(fullName: string): { owner: string; name: string } | null {
  const trimmed = fullName.trim()
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(trimmed)
  if (!match) return null
  return { owner: match[1], name: match[2] }
}

function parse_graphql_payload<T>(
  raw: ExternalObject,
): GraphQLResponse<T & { rateLimit?: GraphQLRateLimit }> {
  const data_raw = raw.data
  const errors_raw = raw.errors
  return {
    data:
      data_raw !== undefined && is_external_object(data_raw)
        ? parse_graphql_data<T>(data_raw)
        : undefined,
    errors: Array.isArray(errors_raw) ? parse_graphql_errors(errors_raw) : undefined,
  }
}

function parse_graphql_data<T>(data: ExternalObject): T & { rateLimit?: GraphQLRateLimit } {
  // SAFETY: GraphQL `data` is decoded once at the HTTP boundary; callers validate query-specific fields.
  return data as T & { rateLimit?: GraphQLRateLimit }
}

function parse_graphql_errors(errors: ExternalValue[]): { message: string; type?: string }[] {
  const parsed: { message: string; type?: string }[] = []
  for (const error of errors) {
    if (!is_external_object(error)) continue
    const message = error.message
    parsed.push({
      message: is_string_value(message) ? message : 'GraphQL error',
      type: is_string_value(error.type) ? error.type : undefined,
    })
  }
  return parsed
}
