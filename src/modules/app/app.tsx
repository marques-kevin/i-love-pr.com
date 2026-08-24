import { useIntl } from 'react-intl'
import { AccountPicker } from '@/modules/accounts/components/account_picker'
import { Onboarding } from '@/modules/onboarding'
import { AppChromeHeader } from './components/app_chrome_header'
import { AppShell } from './components/app_shell'
import { should_mount_app_shell } from '@/lib/guest_workspace'
import { connector, type ConnectorProps } from './app.connector'

export function Wrapper({
  settings,
  settings_loading,
  boot_share_import_loading,
  boot_share_import_error,
  accounts,
  adding_account,
}: ConnectorProps) {
  const intl = useIntl()

  if (settings_loading || boot_share_import_loading) {
    return (
      <div className="min-h-screen">
        <AppChromeHeader />
        <div className="flex items-center justify-center px-4 py-24 text-base-content/60">
          {intl.formatMessage({ id: 'app.loading' })}
        </div>
      </div>
    )
  }

  if (boot_share_import_error) {
    return (
      <div className="min-h-screen">
        <AppChromeHeader />
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-24 text-center">
          <p className="text-error text-sm">
            {intl.formatMessage({ id: 'app.share_import_error' })}
          </p>
          <p className="text-base-content/60 max-w-md text-sm">
            {intl.formatMessage({ id: 'app.share_import_error_hint' })}
          </p>
        </div>
      </div>
    )
  }

  if (should_mount_app_shell(settings)) {
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
