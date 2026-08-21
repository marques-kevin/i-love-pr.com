import { Link, useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { ArrowLeft01Icon } from '@/components/icons/arrow_left_01'
import { IlovePrLogo } from '@/components/ilove_pr_logo'
import { split_repo_full_name } from '@/lib/repo_path'
import { QuietSyncStatus } from '@/modules/sync/components/quiet_sync_status'
import { DashboardTabs } from './dashboard_tabs'

export function DashboardHeader() {
  const intl = useIntl()
  const { owner, name } = useParams()
  const repo = owner && name ? `${owner}/${name}` : ''
  const parts = split_repo_full_name(repo)
  const back_label = intl.formatMessage({ id: 'dashboard.back_to_list' })

  return (
    <header className="navbar bg-base-100/90 sticky top-0 z-40 min-h-0 w-full items-start border-b border-base-300/60 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className="btn btn-ghost btn-circle btn-sm shrink-0"
            aria-label={back_label}
            title={back_label}
          >
            <HoverIcon icon={ArrowLeft01Icon} size={18} />
          </Link>
          <Link to="/" className="flex shrink-0 items-center text-base-content no-underline">
            <IlovePrLogo className="h-7 w-auto sm:h-8" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-lg font-semibold tracking-tight sm:text-xl">
              {parts.name}
            </h1>
            <p className="text-base-content/60 truncate text-sm">{parts.owner}</p>
          </div>
          <div className="min-w-0 shrink-0">
            <QuietSyncStatus />
          </div>
        </div>

        <div className="min-w-0 overflow-x-auto [scrollbar-width:thin]">
          <DashboardTabs />
        </div>
      </div>
    </header>
  )
}
