import { Button } from '@/components/ui/button'
import { Dashboard } from '@/modules/dashboard'
import { Onboarding } from '@/modules/onboarding'
import { Settings } from '@/modules/settings'
import { SyncStatus } from '@/modules/sync'
import { connector, type ConnectorProps } from './app.connector'

export function Wrapper({ settings, settings_loading, set_show_settings }: ConnectorProps) {
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
