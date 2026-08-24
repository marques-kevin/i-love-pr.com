import { useIntl } from 'react-intl'
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
  import_repo_requested,
  import_job_status,
}: ConnectorProps) {
  const intl = useIntl()
  const import_job_active = import_job_status !== 'idle'
  const show_shell = Boolean(settings) || import_repo_requested || import_job_active

  if (settings_loading && !show_shell) {
    return (
      <div className="min-h-screen">
        <AppChromeHeader />
        <div className="flex items-center justify-center px-4 py-24 text-base-content/60">
          {intl.formatMessage({ id: 'app.loading' })}
        </div>
      </div>
    )
  }

  if (show_shell) {
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
