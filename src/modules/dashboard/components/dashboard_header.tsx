import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { Cancel01Icon } from '@/components/icons/cancel_01'
import { QuietSyncStatus } from '@/modules/sync/components/quiet_sync_status'
import { DashboardTabs } from './dashboard_tabs'

type DashboardHeaderProps = {
  on_close_window: () => void
}

export function DashboardHeader({ on_close_window }: DashboardHeaderProps) {
  const intl = useIntl()
  const { owner, name } = useParams()
  const repo_label = owner && name ? `${owner}/${name}` : ''
  const back_label = intl.formatMessage({ id: 'dashboard.back_to_list' })

  return (
    <div className="flex min-w-0 items-center gap-1 sm:gap-2">
      <button
        type="button"
        className="btn btn-ghost btn-circle btn-sm shrink-0"
        aria-label={back_label}
        title={back_label}
        onClick={on_close_window}
      >
        <HoverIcon icon={Cancel01Icon} size={18} />
      </button>

      <DashboardTabs />

      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 pl-2">
        <span className="truncate text-sm text-base-content/60">{repo_label}</span>
        <QuietSyncStatus />
      </div>
    </div>
  )
}
