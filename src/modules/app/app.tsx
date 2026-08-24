import { Navigate, useLocation } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { resolve_app_gate } from '@/lib/app_gate'
import { repo_dashboard_path } from '@/lib/repo_path'
import { share_id_from_path_and_search } from '@/lib/repo_snapshot'
import { AccountPicker } from '@/modules/accounts/components/account_picker'
import { Onboarding } from '@/modules/onboarding'
import { AppChromeHeader } from './components/app_chrome_header'
import { AppShell } from './components/app_shell'
import { connector, type ConnectorProps } from './app.connector'

export function Wrapper({
  settings,
  settings_loading,
  accounts,
  adding_account,
  share_import_status,
  share_import_error,
  share_import_repo,
}: ConnectorProps) {
  const intl = useIntl()
  const location = useLocation()
  const share_id = share_id_from_path_and_search(location.pathname, location.search)
  const gate = resolve_app_gate({
    settings,
    settings_loading,
    share_import_status,
    accounts_count: accounts.length,
    adding_account,
  })

  if (gate === 'loading') {
    return (
      <div className="min-h-screen">
        <AppChromeHeader />
        <div className="flex items-center justify-center px-4 py-24 text-base-content/60">
          {intl.formatMessage({
            id: share_import_status === 'pending' ? 'app.import_share.loading' : 'app.loading',
          })}
        </div>
      </div>
    )
  }

  if (gate === 'import_error') {
    return (
      <div className="min-h-screen">
        <AppChromeHeader />
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
          <div role="alert" className="alert alert-error">
            <span>{intl.formatMessage({ id: 'app.import_share.failed_title' })}</span>
          </div>
          <p className="text-base-content/60 mt-4 text-sm">
            {share_import_error?.trim() ||
              intl.formatMessage({ id: 'app.import_share.failed_body' })}
          </p>
        </div>
      </div>
    )
  }

  if (gate === 'shell' && settings) {
    if (share_import_repo && share_id) {
      return <Navigate to={repo_dashboard_path(share_import_repo)} replace />
    }
    return <AppShell />
  }

  const show_picker = gate === 'account_picker'

  return (
    <div className="min-h-screen">
      <AppChromeHeader />
      {show_picker ? <AccountPicker /> : <Onboarding />}
    </div>
  )
}

export const App = connector(Wrapper)
export default App
