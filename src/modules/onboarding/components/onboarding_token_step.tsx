import { FormattedMessage, useIntl } from 'react-intl'
import { AlertCircleIcon } from '@/components/ui/alert-circle'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MinusSignCircleIcon } from '@/components/ui/minus-sign-circle'
import { Tick02Icon } from '@/components/ui/tick-02'
import type { TokenScopeAnalysis } from '@/lib/github_token_scopes'
import type { RateLimitInfo } from '@/lib/types'
import { onboarding_scope_message_key } from '@/lib/i18n'
import { OnboardingHoverIcon, type OnboardingAnimatedIcon } from './onboarding_hover_icon'
import { landing_command_box, landing_hairline } from './onboarding_surface'

interface OnboardingTokenStepProps {
  token: string
  on_token_change: (token: string) => void
  login: string | null
  rate_limit: RateLimitInfo | null
  scope_analysis: TokenScopeAnalysis | null
  validating: boolean
  saving: boolean
  error: string | null
  on_validate: () => void
  on_submit: () => void
  can_submit: boolean
}

const ALERT_WITH_ICON =
  'grid-cols-[auto_1fr] gap-x-2 [&>div:first-child]:row-span-2 [&>div:first-child]:translate-y-0.5'

function scope_status_label(
  intl: ReturnType<typeof useIntl>,
  status: TokenScopeAnalysis['scopes'][number]['status'],
): string {
  switch (status) {
    case 'granted':
      return intl.formatMessage({ id: 'onboarding.scopes.status.granted' })
    case 'missing':
      return intl.formatMessage({ id: 'onboarding.scopes.status.missing' })
    case 'not_applicable':
      return intl.formatMessage({ id: 'onboarding.scopes.status.covered' })
  }
}

function ScopeStatusIcon({ status }: { status: TokenScopeAnalysis['scopes'][number]['status'] }) {
  const icon: OnboardingAnimatedIcon = status === 'missing' ? MinusSignCircleIcon : Tick02Icon
  const icon_className = status === 'granted' ? 'text-primary' : 'text-muted-foreground'

  return (
    <OnboardingHoverIcon
      icon={icon}
      size={16}
      className="shrink-0"
      icon_className={icon_className}
    />
  )
}

export function OnboardingTokenStep({
  token,
  on_token_change,
  login,
  rate_limit,
  scope_analysis,
  validating,
  saving,
  error,
  on_validate,
  on_submit,
  can_submit,
}: OnboardingTokenStepProps) {
  const intl = useIntl()

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {intl.formatMessage({ id: 'onboarding.token_kicker' })}
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-pretty sm:text-3xl">
          {intl.formatMessage({ id: 'onboarding.setup_title' })}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {intl.formatMessage({ id: 'onboarding.tagline' })}
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="token" className="sr-only">
          {intl.formatMessage({ id: 'onboarding.token_label' })}
        </Label>
        <div className={`max-w-xl ${landing_command_box}`}>
          <span className="hidden pl-4 font-mono text-sm text-muted-foreground sm:inline">$</span>
          <Input
            id="token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => on_token_change(e.target.value)}
            placeholder={intl.formatMessage({ id: 'onboarding.token_placeholder' })}
            className="h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent font-mono text-sm shadow-none focus-visible:border-transparent focus-visible:ring-0"
          />
          <button
            type="button"
            className={`m-1.5 h-9 shrink-0 rounded-[12px] bg-background px-4 text-sm font-medium text-foreground disabled:opacity-50 ${landing_hairline}`}
            onClick={on_validate}
            disabled={!token.trim() || validating}
          >
            {validating
              ? intl.formatMessage({ id: 'onboarding.checking' })
              : intl.formatMessage({ id: 'onboarding.validate' })}
          </button>
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

      {scope_analysis && login && (
        <div className="space-y-3 rounded-2xl bg-muted/40 p-4 sm:p-5">
          <div>
            <h3 className="text-sm font-medium">
              {intl.formatMessage({ id: 'onboarding.scopes.title' })}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {scope_analysis.token_type === 'fine_grained'
                ? intl.formatMessage({ id: 'onboarding.scopes.fine_grained_help' })
                : intl.formatMessage({ id: 'onboarding.scopes.classic_help' })}
            </p>
          </div>

          {scope_analysis.token_type !== 'fine_grained' && (
            <ul className="space-y-2">
              {scope_analysis.scopes.map((scope_info) => (
                <li
                  key={scope_info.scope}
                  className="flex items-start justify-between gap-3 rounded-xl bg-background px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ScopeStatusIcon status={scope_info.status} />
                      <code className="text-sm">{scope_info.scope}</code>
                      {scope_info.required && (
                        <Badge variant="outline" className="text-[10px]">
                          {intl.formatMessage({ id: 'onboarding.scopes.required_badge' })}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {intl.formatMessage({
                        id: onboarding_scope_message_key(scope_info.scope),
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {scope_status_label(intl, scope_info.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {!scope_analysis.has_required_access && scope_analysis.token_type !== 'fine_grained' && (
            <Alert variant="destructive" className={ALERT_WITH_ICON}>
              <AlertCircleIcon size={16} />
              <AlertTitle>
                {intl.formatMessage({ id: 'onboarding.scopes.missing_title' })}
              </AlertTitle>
              <AlertDescription>
                {intl.formatMessage({ id: 'onboarding.scopes.missing_description' })}
              </AlertDescription>
            </Alert>
          )}

          {scope_analysis.overly_permissive_scopes.length > 0 && (
            <Alert className={ALERT_WITH_ICON}>
              <AlertCircleIcon size={16} />
              <AlertTitle>
                {intl.formatMessage({ id: 'onboarding.scopes.permissive_title' })}
              </AlertTitle>
              <AlertDescription>
                {intl.formatMessage(
                  { id: 'onboarding.scopes.permissive_description' },
                  { scopes: scope_analysis.overly_permissive_scopes.join(', ') },
                )}
              </AlertDescription>
            </Alert>
          )}

          {scope_analysis.can_use_more_restrictive && (
            <Alert>
              <AlertDescription>
                {intl.formatMessage({ id: 'onboarding.scopes.repo_tip' })}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-start">
        <Button
          type="button"
          className="h-10 rounded-xl px-5 shadow-none"
          onClick={on_submit}
          disabled={!can_submit || validating}
        >
          {saving
            ? intl.formatMessage({ id: 'onboarding.starting' })
            : intl.formatMessage({ id: 'onboarding.start' })}
        </Button>
      </div>
    </div>
  )
}
