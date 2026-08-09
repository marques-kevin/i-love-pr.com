import { useIntl } from 'react-intl'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RepoPicker } from '@/components/repo_picker'
import type { GitHubRepoOption } from '@/lib/github-client'

interface OnboardingRepoStepProps {
  available_repos: GitHubRepoOption[]
  repos: string[]
  on_repos_change: (repos: string[]) => void
  token: string
  loading: boolean
  saving: boolean
  error: string | null
  on_back: () => void
  on_submit: () => void
  can_submit: boolean
}

export function OnboardingRepoStep({
  available_repos,
  repos,
  on_repos_change,
  token,
  loading,
  saving,
  error,
  on_back,
  on_submit,
  can_submit,
}: OnboardingRepoStepProps) {
  const intl = useIntl()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          {intl.formatMessage({ id: 'onboarding.step.repos_title' })}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'onboarding.step.repos_description' })}
        </p>
      </div>

      <RepoPicker
        availableRepos={available_repos}
        selected={repos}
        onChange={on_repos_change}
        token={token}
        loading={loading}
        manual_add_visible={false}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={on_back}>
          {intl.formatMessage({ id: 'onboarding.back' })}
        </Button>
        <Button type="button" size="lg" disabled={!can_submit || saving} onClick={on_submit}>
          {saving
            ? intl.formatMessage({ id: 'onboarding.starting' })
            : intl.formatMessage({ id: 'onboarding.start' })}
        </Button>
      </div>
    </div>
  )
}
