import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dashboard } from '@/components/Dashboard'
import { Onboarding } from '@/components/Onboarding'
import { Settings } from '@/components/Settings'
import { SyncStatus } from '@/components/SyncStatus'
import { connector, type ConnectorProps } from './app.connector'

export function Wrapper(props: ConnectorProps) {
  const {
    settings,
    settings_loading,
    syncing,
    progress,
    rate_limit,
    sync_error,
    sync_states,
    bootstrapped,
    selected_repos,
    members,
    period_key,
    custom_from,
    custom_to,
    metrics,
    contributors,
    metrics_loading,
    show_settings,
    load_settings,
    save_settings,
    upsert_team,
    delete_team,
    reset_sync_data,
    clear_all_data,
    run_sync,
    refresh_sync_states,
    set_bootstrapped,
    refresh_metrics,
    set_selected_repos,
    sync_selected_repos_with_settings,
    set_members,
    set_period_key,
    set_custom_from,
    set_custom_to,
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

  useEffect(() => {
    void refresh_metrics()
  }, [
    selected_repos,
    members,
    period_key,
    custom_from,
    custom_to,
    refresh_metrics,
  ])

  if (settings_loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!settings) {
    return (
      <Onboarding
        onComplete={async ({ token, repos }) => {
          await save_settings({ token, repos })
        }}
      />
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
            iLovePR
          </h1>
          <p className="mt-1 text-muted-foreground">
            PR analytics that stay on your machine
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <SyncStatus
            syncing={syncing}
            progress={progress}
            rateLimit={rate_limit}
            syncStates={sync_states}
            error={sync_error}
            onRefresh={() => void run_sync({ force: true })}
          />
          <Button
            variant="link"
            className="h-auto p-0"
            onClick={() => set_show_settings(true)}
          >
            Settings
          </Button>
        </div>
      </header>

      <Dashboard
        repos={settings.repos}
        selectedRepos={selected_repos}
        onSelectedReposChange={set_selected_repos}
        contributors={contributors}
        members={members}
        onMembersChange={set_members}
        teams={settings.teams ?? []}
        onSaveTeam={async (name, selected_members, id) => {
          const next = await upsert_team({ name, members: selected_members, id }).unwrap()
          const team =
            (id ? next.teams.find((t) => t.id === id) : null) ??
            next.teams.find((t) => t.name.toLowerCase() === name.trim().toLowerCase())
          if (team) set_members([...team.members])
        }}
        onDeleteTeam={async (id) => {
          await delete_team(id)
        }}
        periodKey={period_key}
        onPeriodKeyChange={set_period_key}
        customFrom={custom_from}
        customTo={custom_to}
        onCustomFromChange={set_custom_from}
        onCustomToChange={set_custom_to}
        metrics={metrics}
        loading={metrics_loading}
        businessHoursEnabled={settings.businessHours?.enabled === true}
      />

      <Settings
        settings={settings}
        open={show_settings}
        onOpenChange={set_show_settings}
        onSave={async (data) => {
          await save_settings(data)
          void refresh_metrics()
          void run_sync({ force: false })
        }}
        onResetData={async () => {
          await reset_sync_data()
        }}
        onFactoryReset={async () => {
          await clear_all_data()
        }}
        onResetComplete={() => {
          void load_settings().then(() => {
            set_bootstrapped(false)
            set_show_settings(false)
          })
        }}
      />
    </div>
  )
}

export const App = connector(Wrapper)
export default App
