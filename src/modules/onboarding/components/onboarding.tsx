import { useMemo, useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { GitHubClient } from '@/lib/github-client'
import { analyze_token_scopes, type TokenScopeAnalysis } from '@/lib/github_token_scopes'
import type { RateLimitInfo } from '@/lib/types'
import { LocaleSwitcher } from '@/modules/i18n'
import { play_sound } from '@/lib/cuelume'
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

      <section
        ref={setup_ref}
        id="setup"
        className="scroll-mt-16 border-t border-border/60 bg-background/40"
      >
        <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {intl.formatMessage({ id: 'onboarding.setup_title' })}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {intl.formatMessage({ id: 'onboarding.tagline' })}
              </p>
              {adding_account && accounts.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 px-0"
                  onClick={() => void cancel_add_account()}
                >
                  {intl.formatMessage({ id: 'account.back_to_accounts' })}
                </Button>
              ) : null}
            </div>
            <LocaleSwitcher />
          </div>

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
    </div>
  )
}

export const Onboarding = connector(Wrapper)
