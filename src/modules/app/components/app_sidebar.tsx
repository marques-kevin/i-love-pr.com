import { useState } from 'react'
import { CirclePlusIcon, GitBranchIcon, Loader2Icon, SettingsIcon } from 'lucide-react'
import { useIntl } from 'react-intl'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { APP_NAME, APP_VERSION } from '@/lib/app_meta'
import type { SyncState } from '@/lib/types'
import { AccountMenu } from '@/modules/accounts/components/account_menu'
import { AddRepositoryDialog } from '@/modules/settings/components/add_repository_dialog'
import { connector, type ConnectorProps } from './app_sidebar.connector'

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

  function close_add_repo_dialog() {
    set_add_repo_open(false)
    if (add_repository_requested) clear_add_repository_request()
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <img src="/favicon.svg" alt="" width={32} height={32} className="size-8 rounded-lg" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="font-display truncate font-bold tracking-tight">{APP_NAME}</span>
                <span className="truncate text-xs text-muted-foreground">v{APP_VERSION}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={intl.formatMessage({ id: 'app.nav.add_repository' })}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              data-cuelume-press=""
              data-cuelume-release=""
              onClick={() => {
                load_available_repos()
                set_add_repo_open(true)
              }}
            >
              <CirclePlusIcon />
              <span>{intl.formatMessage({ id: 'app.nav.add_repository' })}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {intl.formatMessage({ id: 'app.nav.repositories' })}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {repos.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={intl.formatMessage({ id: 'app.nav.repositories_empty' })}
                    className="text-muted-foreground"
                    disabled
                  >
                    <GitBranchIcon />
                    <span>{intl.formatMessage({ id: 'app.nav.repositories_empty' })}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                repos.map((repo) => {
                  const state = sync_states.find((item) => item.repo_full_name === repo)
                  const cue = sync_cue(state)
                  return (
                    <SidebarMenuItem key={repo}>
                      <SidebarMenuButton
                        isActive={repo === active_repo}
                        tooltip={repo}
                        data-cuelume-press=""
                        data-cuelume-release=""
                        onClick={() => {
                          if (repo !== active_repo) void set_active_repo(repo)
                        }}
                      >
                        <span className="flex size-4 shrink-0 items-center justify-center text-[10px] font-semibold uppercase">
                          {repo_initial(repo)}
                        </span>
                        <span className="truncate">{repo_short_name(repo)}</span>
                      </SidebarMenuButton>
                      {cue === 'syncing' ? (
                        <SidebarMenuBadge>
                          <Loader2Icon className="size-3 animate-spin text-muted-foreground" />
                        </SidebarMenuBadge>
                      ) : null}
                      {cue === 'error' ? (
                        <SidebarMenuBadge>
                          <span
                            className="size-2 rounded-full bg-destructive"
                            aria-label={intl.formatMessage({ id: 'app.nav.sync_error' })}
                          />
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={intl.formatMessage({ id: 'app.settings' })}
                  data-cuelume-press=""
                  data-cuelume-release=""
                  onClick={() => set_show_settings(true)}
                >
                  <SettingsIcon />
                  <span>{intl.formatMessage({ id: 'app.settings' })}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <AccountMenu />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
      {show_add_repo_dialog ? <AddRepositoryDialog on_close={close_add_repo_dialog} /> : null}
    </Sidebar>
  )
}

export const AppSidebar = connector(Wrapper)
