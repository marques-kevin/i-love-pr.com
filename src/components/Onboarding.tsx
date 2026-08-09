import { useMemo, useState, type FormEvent } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RepoPicker } from '@/components/RepoPicker'
import {
  GitHubClient,
  type GitHubRepoOption,
} from '@/lib/github-client'
import type { RateLimitInfo } from '@/lib/types'

interface OnboardingProps {
  onComplete: (data: { token: string; repos: string[] }) => Promise<void>
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [token, setToken] = useState('')
  const [repos, setRepos] = useState<string[]>([])
  const [availableRepos, setAvailableRepos] = useState<GitHubRepoOption[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [login, setLogin] = useState<string | null>(null)
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null)
  const [validating, setValidating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(
    () => Boolean(token.trim()) && repos.length > 0 && Boolean(login),
    [token, repos, login],
  )

  async function validateToken() {
    setError(null)
    setValidating(true)
    setLoadingRepos(true)
    setLogin(null)
    setAvailableRepos([])
    try {
      const client = new GitHubClient(token.trim())
      const result = await client.validateToken()
      setLogin(result.login)
      setRateLimit(result.rateLimit)

      const listed = await client.listRepositories()
      setAvailableRepos(listed.repos)
      if (listed.rateLimit) setRateLimit(listed.rateLimit)
      if (listed.repos.length === 0) {
        setError('No repositories found for this token.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid token')
    } finally {
      setValidating(false)
      setLoadingRepos(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    try {
      await onComplete({ token: token.trim(), repos })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
      setSaving(false)
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

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="token">GitHub Personal Access Token</Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="token"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => {
                setToken(e.target.value)
                setLogin(null)
                setAvailableRepos([])
                setRepos([])
              }}
              placeholder="ghp_… or github_pat_…"
              className="h-10 flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              className="h-10"
              onClick={() => void validateToken()}
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
              {rateLimit && (
                <>
                  {' '}
                  · {rateLimit.remaining}/{rateLimit.limit} GraphQL points remaining
                </>
              )}
            </p>
          )}
        </div>

        <RepoPicker
          availableRepos={availableRepos}
          selected={repos}
          onChange={setRepos}
          token={token}
          loading={loadingRepos}
          disabled={!login}
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" disabled={!canSubmit || saving}>
          {saving ? 'Starting…' : 'Start analyzing'}
        </Button>
      </form>
    </div>
  )
}
