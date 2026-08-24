import { useIntl } from 'react-intl'
import { share_link_from_browser_location } from '@/lib/repo_snapshot'
import { AccountPicker } from '@/modules/accounts/components/account_picker'
import { Onboarding } from '@/modules/onboarding'
import { AppChromeHeader } from './components/app_chrome_header'
import { AppShell } from './components/app_shell'
import { ShareImportError } from './components/share_import_error'
import { connector, type ConnectorProps } from './app.connector'

function settings_have_repos(settings: ConnectorProps['settings']): boolean {
  return Boolean(settings && settings.repos.length > 0)
}

export function Wrapper({
  settings,
  settings_loading,
  accounts,
  adding_account,
  import_job,
}: ConnectorProps) {
  const intl = useIntl()
  const has_share_link = share_link_from_browser_location() !== null
  const has_repos = settings_have_repos(settings)
  const show_import_error =
    import_job.status === 'error' &&
    import_job.confirmed &&
    !has_repos &&
    !import_job.repo_full_name

  if (settings_loading) {
    return (
      <div className="min-h-screen">
        <AppChromeHeader />
        <div className="flex items-center justify-center px-4 py-24 text-base-content/60">
          {intl.formatMessage({ id: 'app.loading' })}
        </div>
      </div>
    )
  }

  if (show_import_error) {
    return <ShareImportError error={import_job.error} />
  }

  if (has_repos || has_share_link || import_job.status === 'running') {
    return <AppShell />
  }

  const show_picker = accounts.length > 0 && !adding_account

  return (
    <div className="min-h-screen">
      <AppChromeHeader />
      {show_picker ? <AccountPicker /> : <Onboarding />}
    </div>
  )
}

export const App = connector(Wrapper)
export default App
