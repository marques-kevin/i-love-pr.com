import { useMemo, useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { GitHubClient } from '@/lib/github-client'
import { analyze_token_scopes, type TokenScopeAnalysis } from '@/lib/github_token_scopes'
import { play_sound } from '@/lib/cuelume'
import type { RateLimitInfo } from '@/lib/types'
import { connector, type ConnectorProps } from './onboarding.connector'
import { OnboardingHero } from './onboarding_hero'
import { OnboardingTokenStep } from './onboarding_token_step'

export function Wrapper({
  accounts,
  adding_account,
  complete_onboarding,
  clear_available_repos,
  cancel_add_account,
}: ConnectorProps) {
  const intl = useIntl()
  const setup_ref = useRef<HTMLElement>(null)
  const [token, set_token] = useState('')
  const [login, set_login] = useState<string | null>(null)
  const [rate_limit, set_rate_limit] = useState<RateLimitInfo | null>(null)
  const [scope_analysis, set_scope_analysis] = useState<TokenScopeAnalysis | null>(null)
  const [validating, set_validating] = useState(false)
  const [saving, set_saving] = useState(false)
  const [error, set_error] = useState<string | null>(null)

  const can_submit = useMemo(
    () => Boolean(login) && Boolean(scope_analysis?.has_required_access) && !saving,
    [login, scope_analysis, saving],
  )

  function reset_token_state() {
    set_login(null)
    set_rate_limit(null)
    set_scope_analysis(null)
    clear_available_repos()
    set_error(null)
  }

  function handle_token_change(next_token: string) {
    set_token(next_token)
    reset_token_state()
  }

  function scroll_to_setup() {
    setup_ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function validate_token() {
    set_error(null)
    set_validating(true)
    set_login(null)
    set_scope_analysis(null)
    clear_available_repos()

    const trimmed = token.trim()
    const client = new GitHubClient(trimmed)

    try {
      const scope_result = await client.inspectTokenScopes()
      set_scope_analysis(analyze_token_scopes(scope_result.scopes, scope_result.token_type))

      if (scope_result.login) {
        set_login(scope_result.login)
        set_rate_limit(scope_result.rate_limit)
      }

      try {
        const result = await client.validateToken()
        set_login(result.login)
        set_rate_limit(result.rateLimit)
      } catch {
        if (!scope_result.login) {
          throw new Error(intl.formatMessage({ id: 'onboarding.error.invalid_token' }))
        }
      }

      play_sound('success')
    } catch (e) {
      play_sound('error')
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
      await complete_onboarding({ token: token.trim() })
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
    <div>
      <OnboardingHero on_get_started={scroll_to_setup} />

      <section ref={setup_ref} id="setup" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
          {adding_account && accounts.length > 0 ? (
            <Button
              type="button"
              className="btn-ghost btn-sm mb-8 px-0"
              onClick={() => void cancel_add_account()}
            >
              {intl.formatMessage({ id: 'account.back_to_accounts' })}
            </Button>
          ) : null}

          <OnboardingTokenStep
            token={token}
            on_token_change={handle_token_change}
            login={login}
            rate_limit={rate_limit}
            scope_analysis={scope_analysis}
            validating={validating}
            saving={saving}
            error={error}
            on_validate={() => void validate_token()}
            on_submit={() => void handle_submit()}
            can_submit={can_submit}
          />
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <p className="text-xs text-base-content/60">
          {intl.formatMessage({ id: 'onboarding.footer' })}
        </p>
      </footer>
    </div>
  )
}

export const Onboarding = connector(Wrapper)
