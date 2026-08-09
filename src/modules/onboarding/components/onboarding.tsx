import { useMemo, useState, type FormEvent } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RepoPicker } from '@/components/repo_picker'
import { GitHubClient } from '@/lib/github-client'
import type { RateLimitInfo } from '@/lib/types'
import { LocaleSwitcher } from '@/modules/i18n'
import { load_available_repos as load_available_repos_thunk } from '@/store'
import { connector, type ConnectorProps } from './onboarding.connector'

export function Wrapper({
  available_repos,
  available_repos_loading,
  save_settings,
  load_available_repos,
  clear_available_repos,
}: ConnectorProps) {
  const intl = useIntl()
  const [token, set_token] = useState('')
  const [repos, set_repos] = useState<string[]>([])
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
    set_login(null)
    clear_available_repos()
    try {
      const trimmed = token.trim()
      const client = new GitHubClient(trimmed)
      const result = await client.validateToken()
      set_login(result.login)
      set_rate_limit(result.rateLimit)

      const action = await load_available_repos({ token: trimmed, force: true })
      if (
        load_available_repos_thunk.fulfilled.match(action) &&
        action.payload.repos.length === 0
      ) {
        set_error(intl.formatMessage({ id: 'onboarding.error.no_repos' }))
      }
    } catch (e) {
      set_error(
        e instanceof Error ? e.message : intl.formatMessage({ id: 'onboarding.error.invalid_token' }),
      )
    } finally {
      set_validating(false)
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
      set_error(
        err instanceof Error
          ? err.message
          : intl.formatMessage({ id: 'onboarding.error.save_failed' }),
      )
      set_saving(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <header className="mb-12">
        <div className="mb-4 flex justify-end">
          <LocaleSwitcher />
        </div>
        <p className="font-display text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          iLovePR
        </p>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          {intl.formatMessage({ id: 'onboarding.tagline' })}
        </p>
      </header>

      <form onSubmit={(e) => void handle_submit(e)} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="token">{intl.formatMessage({ id: 'onboarding.token_label' })}</Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="token"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => {
                set_token(e.target.value)
                set_login(null)
                clear_available_repos()
                set_repos([])
              }}
              placeholder={intl.formatMessage({ id: 'onboarding.token_placeholder' })}
              className="h-10 flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              className="h-10"
              onClick={() => void validate_token()}
              disabled={!token.trim() || validating}
            >
              {validating
                ? intl.formatMessage({ id: 'onboarding.checking' })
                : intl.formatMessage({ id: 'onboarding.validate' })}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            <FormattedMessage
              id="onboarding.token_help"
              values={{
                repo: <code className="text-foreground">repo</code>,
                public_repo: <code className="text-foreground">public_repo</code>,
              }}
            />
          </p>
          {login && (
            <p className="text-sm text-primary">
              {intl.formatMessage({ id: 'onboarding.authenticated_as' }, { login })}
              {rate_limit && (
                <>
                  {' '}
                  ·{' '}
                  {intl.formatMessage(
                    { id: 'onboarding.rate_limit' },
                    { remaining: rate_limit.remaining, limit: rate_limit.limit },
                  )}
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
          loading={available_repos_loading || validating}
          disabled={!login}
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" disabled={!can_submit || saving}>
          {saving
            ? intl.formatMessage({ id: 'onboarding.starting' })
            : intl.formatMessage({ id: 'onboarding.start' })}
        </Button>
      </form>
    </div>
  )
}

export const Onboarding = connector(Wrapper)
