import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { Cancel01Icon } from '@/components/icons/cancel_01'
import { Settings01Icon } from '@/components/icons/settings_01'
import { Button } from '@/components/ui/button'
import { RepoSettingsDialog } from '@/modules/settings/components/repo_settings_dialog'
import { QuietSyncStatus } from '@/modules/sync/components/quiet_sync_status'
import { connector, type ConnectorProps } from './dashboard_header.connector'
import { DashboardTabs } from './dashboard_tabs'

type DashboardHeaderProps = ConnectorProps & {
  on_close_window: () => void
}

export function Wrapper({
  on_close_window,
  load_repo_settings,
  is_imported,
  chrome,
}: DashboardHeaderProps) {
  const intl = useIntl()
  const { owner, name } = useParams()
  const repo_full_name = owner && name ? `${owner}/${name}` : ''
  const repo_label = repo_full_name
  const back_label = intl.formatMessage({ id: 'dashboard.back_to_list' })
  const settings_label = intl.formatMessage({ id: 'repo_gallery.settings' })
  const [settings_open, set_settings_open] = useState(false)

  function handle_open_settings() {
    if (!repo_full_name) return
    load_repo_settings(repo_full_name)
    set_settings_open(true)
  }

  return (
    <>
      <header className="dashboard-window-strip bg-base-200 pt-2 px-2 sm:px-3">
        <div className="flex min-w-0 items-end gap-1">
          <Button
            type="button"
            className="btn-ghost btn-circle btn-sm mb-1 shrink-0"
            aria-label={back_label}
            title={back_label}
            onClick={on_close_window}
          >
            <HoverIcon icon={Cancel01Icon} size={18} />
          </Button>

          <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:thin]">
            <DashboardTabs />
          </div>

          <div className="mb-1 ml-auto flex min-w-0 shrink-0 items-center gap-2">
            {is_imported ? (
              <span className="text-base-content/50 hidden text-xs sm:inline">
                {intl.formatMessage({ id: 'dashboard.imported_snapshot' })}
              </span>
            ) : null}
            <span className="text-base-content/60 max-w-48 truncate text-sm" title={repo_label}>
              {repo_label}
            </span>
            {repo_full_name && chrome.settings_gear ? (
              <Button
                type="button"
                className="btn-ghost btn-circle btn-sm shrink-0"
                aria-label={settings_label}
                title={settings_label}
                onClick={handle_open_settings}
              >
                <HoverIcon icon={Settings01Icon} size={17} />
              </Button>
            ) : null}
            {chrome.sync_status ? <QuietSyncStatus /> : null}
          </div>
        </div>
      </header>

      {chrome.settings_gear ? (
        <RepoSettingsDialog
          open={settings_open}
          repo_full_name={settings_open ? repo_full_name : null}
          on_close={() => set_settings_open(false)}
        />
      ) : null}
    </>
  )
}

export const DashboardHeader = connector(Wrapper)
