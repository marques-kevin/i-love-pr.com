import { useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { GitHubClient } from '@/lib/github-client'
import { analyze_token_scopes, type TokenScopeAnalysis } from '@/lib/github_token_scopes'
import type { RateLimitInfo } from '@/lib/types'
import { LocaleSwitcher } from '@/modules/i18n'
import { connector, type ConnectorProps } from './onboarding.connector'
import { OnboardingRepoStep } from './onboarding_repo_step'
import { OnboardingStepIndicator } from './onboarding_step_indicator'
import { OnboardingTokenStep } from './onboarding_token_step'

export function Wrapper({
  available_repos,
  available_repos_loading,
  save_settings,
  load_available_repos,
  clear_available_repos,
}: ConnectorProps) {
  const intl = useIntl()
  const [step, set_step] = useState<1 | 2>(1)
  const [token, set_token] = useState('')
  const [repos, set_repos] = useState<string[]>([])
  const [login, set_login] = useState<string | null>(null)
  const [rate_limit, set_rate_limit] = useState<RateLimitInfo | null>(null)
  const [scope_analysis, set_scope_analysis] = useState<TokenScopeAnalysis | null>(null)
  const [validating, set_validating] = useState(false)
  const [saving, set_saving] = useState(false)
  const [error, set_error] = useState<string | null>(null)

  const can_continue = useMemo(
    () => Boolean(login) && Boolean(scope_analysis?.has_required_access),
    [login, scope_analysis],
  )

  const can_submit = useMemo(
    () => Boolean(token.trim()) && repos.length > 0 && Boolean(login),
    [token, repos, login],
  )

  function reset_token_state() {
    set_login(null)
    set_rate_limit(null)
    set_scope_analysis(null)
    clear_available_repos()
    set_repos([])
    set_error(null)
  }

  function handle_token_change(next_token: string) {
    set_token(next_token)
    reset_token_state()
  }

  async function validate_token() {
    set_error(null)
    set_validating(true)
    set_login(null)
    set_scope_analysis(null)
    clear_available_repos()
    try {
      const trimmed = token.trim()
      const client = new GitHubClient(trimmed)
      const [result, scope_result] = await Promise.all([
        client.validateToken(),
        client.inspectTokenScopes(),
      ])
      set_login(result.login)
      set_rate_limit(result.rateLimit)
      set_scope_analysis(analyze_token_scopes(scope_result.scopes, scope_result.token_type))

      await load_available_repos({ token: trimmed, force: true })
    } catch (e) {
      set_error(
        e instanceof Error
          ? e.message
          : intl.formatMessage({ id: 'onboarding.error.invalid_token' }),
      )
    } finally {
      set_validating(false)
    }
  }

  async function handle_submit() {
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
      <header className="mb-8">
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

      <OnboardingStepIndicator current_step={step} />

      {step === 1 ? (
        <OnboardingTokenStep
          token={token}
          on_token_change={handle_token_change}
          login={login}
          rate_limit={rate_limit}
          scope_analysis={scope_analysis}
          validating={validating}
          error={error}
          on_validate={() => void validate_token()}
          on_continue={() => {
            set_error(null)
            set_step(2)
          }}
          can_continue={can_continue}
        />
      ) : (
        <OnboardingRepoStep
          available_repos={available_repos}
          repos={repos}
          on_repos_change={set_repos}
          token={token}
          loading={available_repos_loading || validating}
          saving={saving}
          error={error}
          on_back={() => {
            set_error(null)
            set_step(1)
          }}
          on_submit={() => void handle_submit()}
          can_submit={can_submit}
        />
      )}
    </div>
  )
}

export const Onboarding = connector(Wrapper)
