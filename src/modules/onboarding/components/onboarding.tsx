import { useMemo, useState, type FormEvent } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RepoPicker } from '@/components/repo_picker'
import { GitHubClient, type GitHubRepoOption } from '@/lib/github-client'
import type { RateLimitInfo } from '@/lib/types'
import { connector, type ConnectorProps } from './onboarding.connector'

export function Wrapper({ save_settings }: ConnectorProps) {
  const [token, set_token] = useState('')
  const [repos, set_repos] = useState<string[]>([])
  const [available_repos, set_available_repos] = useState<GitHubRepoOption[]>([])
  const [loading_repos, set_loading_repos] = useState(false)
  const [login, set_login] = useState<string | null>(null)
  const [rate_limit, set_rate_limit] = useState<RateLimitInfo | null>(null)
  const [validating, set_validating] = useState(false)
  const [saving, set_saving] = useState(false)
  const [error, set_error] = useState<string | null>(null)

  const can_submit = useMemo(
    () => Boolean(token.trim()) && repos.length > 0 && Boolean(login),
    [token, repos, login],
  )

  async function validate_token() {
    set_error(null)
    set_validating(true)
    set_loading_repos(true)
    set_login(null)
    set_available_repos([])
    try {
      const client = new GitHubClient(token.trim())
      const result = await client.validateToken()
      set_login(result.login)
      set_rate_limit(result.rateLimit)

      const listed = await client.listRepositories()
      set_available_repos(listed.repos)
      if (listed.rateLimit) set_rate_limit(listed.rateLimit)
      if (listed.repos.length === 0) {
        set_error('No repositories found for this token.')
      }
    } catch (e) {
      set_error(e instanceof Error ? e.message : 'Invalid token')
    } finally {
      set_validating(false)
      set_loading_repos(false)
    }
  }

  async function handle_submit(e: FormEvent) {
    e.preventDefault()
    if (!can_submit) return
    set_saving(true)
    set_error(null)
    try {
      await save_settings({ token: token.trim(), repos })
    } catch (err) {
      set_error(err instanceof Error ? err.message : 'Failed to save settings')
      set_saving(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <header className="mb-12">
        <p className="font-display text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          iLovePR
        </p>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Self-hosted GitHub PR analytics. Your token never leaves this browser.
        </p>
      </header>

      <form onSubmit={(e) => void handle_submit(e)} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="token">GitHub Personal Access Token</Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="token"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => {
                set_token(e.target.value)
                set_login(null)
                set_available_repos([])
                set_repos([])
              }}
              placeholder="ghp_… or github_pat_…"
              className="h-10 flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              className="h-10"
              onClick={() => void validate_token()}
              disabled={!token.trim() || validating}
            >
              {validating ? 'Checking…' : 'Validate'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Classic PAT with <code className="text-foreground">repo</code> (or{' '}
            <code className="text-foreground">public_repo</code>) read access.
          </p>
          {login && (
            <p className="text-sm text-primary">
              Authenticated as <strong>@{login}</strong>
              {rate_limit && (
                <>
                  {' '}
                  · {rate_limit.remaining}/{rate_limit.limit} GraphQL points remaining
                </>
              )}
            </p>
          )}
        </div>

        <RepoPicker
          availableRepos={available_repos}
          selected={repos}
          onChange={set_repos}
          token={token}
          loading={loading_repos}
          disabled={!login}
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" disabled={!can_submit || saving}>
          {saving ? 'Starting…' : 'Start analyzing'}
        </Button>
      </form>
    </div>
  )
}

export const Onboarding = connector(Wrapper)
