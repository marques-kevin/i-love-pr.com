import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { Cancel01Icon } from '@/components/icons/cancel_01'
import { Button } from '@/components/ui/button'
import { QuietSyncStatus } from '@/modules/sync/components/quiet_sync_status'
import { DashboardTabs } from './dashboard_tabs'

export function DashboardHeader({ on_close_window }: { on_close_window: () => void }) {
  const intl = useIntl()
  const { owner, name } = useParams()
  const repo_label = owner && name ? `${owner}/${name}` : ''
  const back_label = intl.formatMessage({ id: 'dashboard.back_to_list' })

  return (
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
          <span className="text-base-content/60 max-w-48 truncate text-sm" title={repo_label}>
            {repo_label}
          </span>
          <QuietSyncStatus />
        </div>
      </div>
    </header>
  )
}
