import { useState } from 'react'
import { CheckIcon, ChevronDownIcon, CirclePlusIcon, Loader2Icon, SettingsIcon } from 'lucide-react'
import { useIntl } from 'react-intl'
import { IlovePrLogo } from '@/components/ilove_pr_logo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
    return <Loader2Icon className="size-3 animate-spin text-muted-foreground" />
  }
  if (cue === 'error') {
    return <span className="size-2 rounded-full bg-destructive" aria-label={error_label} />
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
    <button
      type="button"
      aria-pressed={active}
      title={repo}
      data-cuelume-press=""
      data-cuelume-release=""
      onClick={on_select}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-sm transition-colors',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        active
          ? 'bg-background font-medium text-foreground shadow-sm ring-1 ring-foreground/15'
          : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center text-[10px] font-semibold uppercase">
        {repo_initial(repo)}
      </span>
      <span className="max-w-36 truncate">{repo_short_name(repo)}</span>
      <RepoCue cue={cue} error_label={error_label} />
    </button>
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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <IlovePrLogo className="h-7 w-auto sm:h-8" />
            <span className="hidden text-xs font-medium tabular-nums text-muted-foreground sm:inline">
              v{APP_VERSION}
            </span>
          </div>

          <nav
            aria-label={intl.formatMessage({ id: 'app.nav.repositories' })}
            className="hidden min-w-0 flex-1 md:block"
          >
            {repos.length === 0 ? (
              <p className="truncate px-1 text-sm text-muted-foreground">
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
              <p className="truncate text-sm text-muted-foreground">
                {intl.formatMessage({ id: 'app.nav.repositories_empty' })}
              </p>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 w-full max-w-full justify-between gap-2 rounded-full px-2.5"
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
                        <span className="truncate text-muted-foreground">
                          {intl.formatMessage({ id: 'app.nav.select_repository' })}
                        </span>
                      )}
                    </span>
                    <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-56 rounded-xl">
                  {repos.map((repo) => {
                    const state = sync_states.find((item) => item.repo_full_name === repo)
                    const cue = sync_cue(state)
                    const active = repo === active_repo
                    return (
                      <DropdownMenuItem
                        key={repo}
                        onClick={() => select_repo(repo)}
                        className="gap-2"
                      >
                        <span className="flex size-4 shrink-0 items-center justify-center text-[10px] font-semibold uppercase">
                          {repo_initial(repo)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{repo_short_name(repo)}</span>
                        <RepoCue cue={cue} error_label={error_label} />
                        {active ? <CheckIcon className="size-4 text-foreground" /> : null}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-full"
              aria-label={intl.formatMessage({ id: 'app.nav.add_repository' })}
              onClick={open_add_repo}
            >
              <CirclePlusIcon />
              <span className="hidden sm:inline">
                {intl.formatMessage({ id: 'app.nav.add_repository' })}
              </span>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  aria-label={intl.formatMessage({ id: 'app.settings' })}
                  onClick={() => set_show_settings(true)}
                >
                  <SettingsIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{intl.formatMessage({ id: 'app.settings' })}</TooltipContent>
            </Tooltip>
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
