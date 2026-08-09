import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dashboard } from '@/modules/dashboard'
import { Onboarding } from '@/modules/onboarding'
import { Settings } from '@/modules/settings'
import { SyncStatus } from '@/modules/sync'
import { connector, type ConnectorProps } from './app.connector'

export function Wrapper(props: ConnectorProps) {
  const {
    settings,
    settings_loading,
    bootstrapped,
    syncing,
    load_settings,
    sync_selected_repos_with_settings,
    set_bootstrapped,
    run_sync,
    refresh_sync_states,
    refresh_metrics,
    set_show_settings,
  } = props

  useEffect(() => {
    void load_settings()
  }, [load_settings])

  useEffect(() => {
    if (!settings) return
    sync_selected_repos_with_settings(settings.repos)
  }, [settings, sync_selected_repos_with_settings])

  useEffect(() => {
    if (!settings || bootstrapped) return
    set_bootstrapped(true)
    void run_sync({ force: false })
  }, [settings, bootstrapped, run_sync, set_bootstrapped])

  useEffect(() => {
    if (syncing) return
    void refresh_sync_states()
    void refresh_metrics()
  }, [syncing, refresh_sync_states, refresh_metrics])

  if (settings_loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!settings) {
    return <Onboarding />
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
            iLovePR
          </h1>
          <p className="mt-1 text-muted-foreground">PR analytics that stay on your machine</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <SyncStatus />
          <Button variant="link" className="h-auto p-0" onClick={() => set_show_settings(true)}>
            Settings
          </Button>
        </div>
      </header>

      <Dashboard />
      <Settings />
    </div>
  )
}

export const App = connector(Wrapper)
export default App
