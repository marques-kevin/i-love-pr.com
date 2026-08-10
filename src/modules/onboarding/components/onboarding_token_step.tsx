import { FormattedMessage, useIntl } from 'react-intl'
import { AlertTriangleIcon, CheckIcon, CircleIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TokenScopeAnalysis } from '@/lib/github_token_scopes'
import type { RateLimitInfo } from '@/lib/types'

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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          {intl.formatMessage({ id: 'onboarding.step.token_title' })}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'onboarding.step.token_description' })}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="token">{intl.formatMessage({ id: 'onboarding.token_label' })}</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => on_token_change(e.target.value)}
            placeholder={intl.formatMessage({ id: 'onboarding.token_placeholder' })}
            className="h-10 flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            className="h-10"
            onClick={on_validate}
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

      {scope_analysis && login && (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
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
                  className="flex items-start justify-between gap-3 rounded-md bg-background px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {scope_info.status === 'granted' ? (
                        <CheckIcon className="size-4 shrink-0 text-primary" />
                      ) : scope_info.status === 'not_applicable' ? (
                        <CheckIcon className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <CircleIcon className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <code className="text-sm">{scope_info.scope}</code>
                      {scope_info.required && (
                        <Badge variant="outline" className="text-[10px]">
                          {intl.formatMessage({ id: 'onboarding.scopes.required_badge' })}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {intl.formatMessage({
                        id: `onboarding.scope.${scope_info.scope.replace(':', '_')}` as
                          | 'onboarding.scope.public_repo'
                          | 'onboarding.scope.repo'
                          | 'onboarding.scope.read_user',
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
            <Alert variant="destructive">
              <AlertTriangleIcon className="size-4" />
              <AlertTitle>
                {intl.formatMessage({ id: 'onboarding.scopes.missing_title' })}
              </AlertTitle>
              <AlertDescription>
                {intl.formatMessage({ id: 'onboarding.scopes.missing_description' })}
              </AlertDescription>
            </Alert>
          )}

          {scope_analysis.overly_permissive_scopes.length > 0 && (
            <Alert>
              <AlertTriangleIcon className="size-4" />
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

      <div className="flex justify-end">
        <Button type="button" onClick={on_submit} disabled={!can_submit || validating}>
          {saving
            ? intl.formatMessage({ id: 'onboarding.starting' })
            : intl.formatMessage({ id: 'onboarding.start' })}
        </Button>
      </div>
    </div>
  )
}
