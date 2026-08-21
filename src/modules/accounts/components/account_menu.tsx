import { useIntl } from 'react-intl'
import { ChevronDownIcon } from '@/components/icons/chevron_down'
import { Logout01Icon } from '@/components/icons/logout_01'
import { PlusSignIcon } from '@/components/icons/plus_sign'
import { UserIcon } from '@/components/icons/user'
import { Button } from '@/components/ui/button'
import { close_daisy_dropdown } from '@/lib/daisy'
import { account_display_name, account_secondary_line } from '@/lib/session'
import type { SavedAccount } from '@/lib/types'
import { cn } from '@/lib/utils'
import { connector, type ConnectorProps } from './account_menu.connector'

function initials(login: string, name: string | null): string {
  const source = name?.trim() || login
  return source.slice(0, 2).toUpperCase()
}

function AccountAvatar({ account, className }: { account: SavedAccount; className?: string }) {
  return (
    <div className={cn('avatar', className)}>
      <div className="bg-neutral text-neutral-content w-full rounded-full">
        {account.avatar_url ? (
          <img src={account.avatar_url} alt="" />
        ) : (
          <span className="flex size-full items-center justify-center text-[10px] font-semibold">
            {initials(account.login, account.name)}
          </span>
        )}
      </div>
    </div>
  )
}

export function Wrapper({
  accounts,
  active_login,
  logout_account,
  switch_account,
  start_add_account,
}: ConnectorProps) {
  const intl = useIntl()
  const active = accounts.find((account) => account.login === active_login) ?? null

  if (!active) {
    return (
      <Button
        type="button"
        className="btn-outline btn-circle btn-sm"
        disabled
        aria-label={intl.formatMessage({ id: 'account.unknown' })}
      >
        <UserIcon size={16} aria-hidden={true} />
      </Button>
    )
  }

  const other_accounts = accounts.filter((account) => account.login !== active.login)
  const display_name = account_display_name(active)

  return (
    <div className="dropdown dropdown-end">
      <Button
        type="button"
        tabIndex={0}
        className="btn-outline btn-sm h-8 gap-2 rounded-full px-1.5 sm:h-9 sm:px-2"
        aria-label={display_name}
        title={display_name}
      >
        <AccountAvatar account={active} className="size-6 sm:size-7" />
        <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">
          {display_name}
        </span>
        <ChevronDownIcon
          size={16}
          className="text-base-content/60 hidden sm:block"
          aria-hidden={true}
        />
      </Button>
      <ul
        tabIndex={-1}
        className="dropdown-content menu bg-base-100 rounded-box z-50 mt-2 min-w-56 p-2 shadow"
      >
        <li className="menu-title">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left font-normal text-base-content">
            <AccountAvatar account={active} className="size-8" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{display_name}</span>
              <span className="text-base-content/60 truncate text-xs">
                {account_secondary_line(active)}
              </span>
            </div>
          </div>
        </li>
        {other_accounts.length > 0
          ? other_accounts.map((account) => (
              <li key={account.login}>
                <button
                  type="button"
                  onClick={(event) => {
                    void switch_account(account.login)
                    close_daisy_dropdown(event.currentTarget)
                  }}
                >
                  <AccountAvatar account={account} className="size-4" />
                  <span className="truncate">{account_display_name(account)}</span>
                </button>
              </li>
            ))
          : null}
        <li>
          <button
            type="button"
            onClick={(event) => {
              void start_add_account()
              close_daisy_dropdown(event.currentTarget)
            }}
          >
            <PlusSignIcon size={16} aria-hidden={true} />
            {intl.formatMessage({ id: 'account.add' })}
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={(event) => {
              void logout_account()
              close_daisy_dropdown(event.currentTarget)
            }}
          >
            <Logout01Icon size={16} aria-hidden={true} />
            {intl.formatMessage({ id: 'account.logout' })}
          </button>
        </li>
      </ul>
    </div>
  )
}

export const AccountMenu = connector(Wrapper)
