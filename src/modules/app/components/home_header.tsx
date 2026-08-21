import { useState } from 'react'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { Download01Icon } from '@/components/icons/download_01'
import { PlusSignIcon } from '@/components/icons/plus_sign'
import { Settings01Icon } from '@/components/icons/settings_01'
import { IlovePrLogo } from '@/components/ilove_pr_logo'
import { Button } from '@/components/ui/button'
import { APP_VERSION } from '@/lib/app_meta'
import { AccountMenu } from '@/modules/accounts/components/account_menu'
import { AddRepositoryDialog } from '@/modules/settings/components/add_repository_dialog'
import { ImportSnapshotDialog } from './import_snapshot_dialog'
import { connector, type ConnectorProps } from './home_header.connector'

export function Wrapper({
  add_repository_requested,
  import_dialog_open,
  import_prefill_link,
  set_show_settings,
  load_available_repos,
  clear_add_repository_request,
  open_import_dialog,
}: ConnectorProps) {
  const intl = useIntl()
  const [add_repo_open, set_add_repo_open] = useState(false)
  const show_add_repo_dialog = add_repo_open || add_repository_requested

  function close_add_repo_dialog() {
    set_add_repo_open(false)
    if (add_repository_requested) clear_add_repository_request()
  }

  function open_add_repo() {
    load_available_repos()
    set_add_repo_open(true)
  }

  return (
    <header className="navbar bg-base-100/90 sticky top-0 z-40 min-h-0 w-full border-b border-base-300/60 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[90rem] items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <IlovePrLogo className="h-7 w-auto sm:h-8" />
          <span className="text-base-content/60 hidden text-xs font-medium tabular-nums sm:inline">
            v{APP_VERSION}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            type="button"
            className="btn-ghost btn-sm rounded-full"
            aria-label={intl.formatMessage({ id: 'app.nav.import' })}
            onClick={() => open_import_dialog()}
          >
            <HoverIcon icon={Download01Icon} size={16} />
            <span className="hidden sm:inline">{intl.formatMessage({ id: 'app.nav.import' })}</span>
          </Button>
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
      {show_add_repo_dialog ? <AddRepositoryDialog on_close={close_add_repo_dialog} /> : null}
      {import_dialog_open ? (
        <ImportSnapshotDialog key={import_prefill_link || 'import-dialog'} />
      ) : null}
    </header>
  )
}

export const HomeHeader = connector(Wrapper)
