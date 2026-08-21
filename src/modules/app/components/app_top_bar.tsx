import { useState } from 'react'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { ChevronDownIcon } from '@/components/icons/chevron_down'
import { Loading03Icon } from '@/components/icons/loading_03'
import { PlusSignIcon } from '@/components/icons/plus_sign'
import { Settings01Icon } from '@/components/icons/settings_01'
import { Tick02Icon } from '@/components/icons/tick_02'
import { IlovePrLogo } from '@/components/ilove_pr_logo'
import { Button } from '@/components/ui/button'
import { close_daisy_dropdown } from '@/lib/daisy'
import { APP_VERSION } from '@/lib/app_meta'
import type { SyncState } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AccountMenu } from '@/modules/accounts/components/account_menu'
import { DashboardTabs } from '@/modules/dashboard'
import { AddRepositoryDialog } from '@/modules/settings/components/add_repository_dialog'
import { SyncStatus } from '@/modules/sync'
import { connector, type ConnectorProps } from './app_top_bar.connector'

function repo_short_name(full_name: string): string {
  const parts = full_name.split('/')
  return parts[1] || full_name
}

function repo_initial(full_name: string): string {
  const name = repo_short_name(full_name)
  return name.charAt(0).toUpperCase() || '?'
}

function sync_cue(state: SyncState | undefined): 'idle' | 'syncing' | 'error' {
  if (!state) return 'idle'
  if (state.last_error) return 'error'
  if (state.mode === 'backfill' || state.mode === 'incremental' || state.mode === 'paused') {
    return 'syncing'
  }
  return 'idle'
}

function RepoCue({ cue, error_label }: { cue: 'idle' | 'syncing' | 'error'; error_label: string }) {
  if (cue === 'syncing') {
    return (
      <Loading03Icon size={12} className="text-base-content/60 animate-spin" aria-hidden={true} />
    )
  }
  if (cue === 'error') {
    return <span className="bg-error size-2 rounded-full" aria-label={error_label} />
  }
  return null
}

function RepoChip({
  repo,
  active,
  cue,
  error_label,
  on_select,
}: {
  repo: string
  active: boolean
  cue: 'idle' | 'syncing' | 'error'
  error_label: string
  on_select: () => void
}) {
  return (
    <Button
      type="button"
      aria-pressed={active}
      title={repo}
      onClick={on_select}
      className={cn('btn-sm shrink-0 rounded-full', active ? 'btn-neutral' : 'btn-ghost')}
    >
      <span className="flex size-4 shrink-0 items-center justify-center text-[10px] font-semibold uppercase">
        {repo_initial(repo)}
      </span>
      <span className="max-w-36 truncate">{repo_short_name(repo)}</span>
      <RepoCue cue={cue} error_label={error_label} />
    </Button>
  )
}

export function Wrapper({
  repos,
  active_repo,
  sync_states,
  add_repository_requested,
  set_show_settings,
  set_active_repo,
  load_available_repos,
  clear_add_repository_request,
}: ConnectorProps) {
  const intl = useIntl()
  const [add_repo_open, set_add_repo_open] = useState(false)
  const show_add_repo_dialog = add_repo_open || add_repository_requested
  const error_label = intl.formatMessage({ id: 'app.nav.sync_error' })
  const active_short = active_repo ? repo_short_name(active_repo) : null
  const active_cue = sync_cue(sync_states.find((item) => item.repo_full_name === active_repo))

  function close_add_repo_dialog() {
    set_add_repo_open(false)
    if (add_repository_requested) clear_add_repository_request()
  }

  function open_add_repo() {
    load_available_repos()
    set_add_repo_open(true)
  }

  function select_repo(repo: string) {
    if (repo !== active_repo) void set_active_repo(repo)
  }

  return (
    <header className="navbar bg-base-100/90 sticky top-0 z-40 min-h-0 w-full items-start border-b border-base-300/60 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <IlovePrLogo className="h-7 w-auto sm:h-8" />
            <span className="text-base-content/60 hidden text-xs font-medium tabular-nums sm:inline">
              v{APP_VERSION}
            </span>
          </div>

          <nav
            aria-label={intl.formatMessage({ id: 'app.nav.repositories' })}
            className="hidden min-w-0 flex-1 md:block"
          >
            {repos.length === 0 ? (
              <p className="text-base-content/60 truncate px-1 text-sm">
                {intl.formatMessage({ id: 'app.nav.repositories_empty' })}
              </p>
            ) : (
              <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:thin]">
                {repos.map((repo) => {
                  const state = sync_states.find((item) => item.repo_full_name === repo)
                  return (
                    <RepoChip
                      key={repo}
                      repo={repo}
                      active={repo === active_repo}
                      cue={sync_cue(state)}
                      error_label={error_label}
                      on_select={() => select_repo(repo)}
                    />
                  )
                })}
              </div>
            )}
          </nav>

          <div className="min-w-0 flex-1 md:hidden">
            {repos.length === 0 ? (
              <p className="text-base-content/60 truncate text-sm">
                {intl.formatMessage({ id: 'app.nav.repositories_empty' })}
              </p>
            ) : (
              <div className="dropdown w-full">
                <Button
                  type="button"
                  tabIndex={0}
                  className="btn-outline btn-sm w-full max-w-full justify-between rounded-full"
                  aria-label={intl.formatMessage({ id: 'app.nav.select_repository' })}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    {active_repo ? (
                      <>
                        <span className="flex size-4 shrink-0 items-center justify-center text-[10px] font-semibold uppercase">
                          {repo_initial(active_repo)}
                        </span>
                        <span className="truncate">{active_short}</span>
                        <RepoCue cue={active_cue} error_label={error_label} />
                      </>
                    ) : (
                      <span className="text-base-content/60 truncate">
                        {intl.formatMessage({ id: 'app.nav.select_repository' })}
                      </span>
                    )}
                  </span>
                  <HoverIcon
                    icon={ChevronDownIcon}
                    size={16}
                    icon_className="text-base-content/60"
                  />
                </Button>
                <ul
                  tabIndex={-1}
                  className="dropdown-content menu bg-base-100 rounded-box z-50 mt-2 w-full min-w-56 p-2 shadow"
                >
                  {repos.map((repo) => {
                    const state = sync_states.find((item) => item.repo_full_name === repo)
                    const cue = sync_cue(state)
                    const active = repo === active_repo
                    return (
                      <li key={repo}>
                        <button
                          type="button"
                          onClick={(event) => {
                            select_repo(repo)
                            close_daisy_dropdown(event.currentTarget)
                          }}
                        >
                          <span className="flex size-4 shrink-0 items-center justify-center text-[10px] font-semibold uppercase">
                            {repo_initial(repo)}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{repo_short_name(repo)}</span>
                          <RepoCue cue={cue} error_label={error_label} />
                          {active ? <HoverIcon icon={Tick02Icon} size={16} /> : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              className="btn-primary btn-sm rounded-full"
              aria-label={intl.formatMessage({ id: 'app.nav.add_repository' })}
              onClick={open_add_repo}
            >
              <HoverIcon icon={PlusSignIcon} size={16} />
              <span className="hidden sm:inline">
                {intl.formatMessage({ id: 'app.nav.add_repository' })}
              </span>
            </Button>
            <div
              className="tooltip tooltip-bottom"
              data-tip={intl.formatMessage({ id: 'app.settings' })}
            >
              <Button
                type="button"
                className="btn-outline btn-circle btn-sm"
                aria-label={intl.formatMessage({ id: 'app.settings' })}
                onClick={() => set_show_settings(true)}
              >
                <HoverIcon icon={Settings01Icon} size={16} />
              </Button>
            </div>
            <AccountMenu />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:thin]">
            <DashboardTabs />
          </div>
          <div className="min-w-0 shrink-0 sm:max-w-xl">
            <SyncStatus />
          </div>
        </div>
      </div>
      {show_add_repo_dialog ? <AddRepositoryDialog on_close={close_add_repo_dialog} /> : null}
    </header>
  )
}

export const AppTopBar = connector(Wrapper)
