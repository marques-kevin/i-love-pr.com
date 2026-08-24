import { useIntl } from 'react-intl'
import { AccountPicker } from '@/modules/accounts/components/account_picker'
import { Onboarding } from '@/modules/onboarding'
import { AppChromeHeader } from './components/app_chrome_header'
import { AppShell } from './components/app_shell'
import { ShareImportError } from './components/share_import_error'
import { connector, type ConnectorProps } from './app.connector'

export function Wrapper({
  settings,
  settings_loading,
  accounts,
  adding_account,
  share_boot_import_status,
  share_boot_import_error,
}: ConnectorProps) {
  const intl = useIntl()

  if (settings_loading || share_boot_import_status === 'pending') {
    return (
      <div className="min-h-screen">
        <AppChromeHeader />
        <div className="flex items-center justify-center px-4 py-24 text-base-content/60">
          {intl.formatMessage({ id: 'app.loading' })}
        </div>
      </div>
    )
  }

  if (share_boot_import_status === 'error') {
    return <ShareImportError error={share_boot_import_error} />
  }

  if (settings) {
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
