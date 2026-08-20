import { ChevronsUpDownIcon, LogOutIcon, PlusIcon, UserRoundIcon } from 'lucide-react'
import { useIntl } from 'react-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { account_display_name, account_secondary_line } from '@/lib/session'
import type { SavedAccount } from '@/lib/types'
import { connector, type ConnectorProps } from './account_menu.connector'

function initials(login: string, name: string | null): string {
  const source = name?.trim() || login
  return source.slice(0, 2).toUpperCase()
}

function AccountAvatar({ account, className }: { account: SavedAccount; className?: string }) {
  return (
    <Avatar className={className}>
      {account.avatar_url ? <AvatarImage src={account.avatar_url} alt="" /> : null}
      <AvatarFallback>{initials(account.login, account.name)}</AvatarFallback>
    </Avatar>
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
        variant="outline"
        size="icon"
        className="rounded-full"
        disabled
        aria-label={intl.formatMessage({ id: 'account.unknown' })}
      >
        <UserRoundIcon />
      </Button>
    )
  }

  const other_accounts = accounts.filter((account) => account.login !== active.login)
  const display_name = account_display_name(active)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-8 gap-2 rounded-full px-1.5 sm:h-9 sm:px-2"
          aria-label={display_name}
          title={display_name}
        >
          <AccountAvatar account={active} className="size-6 sm:size-7" />
          <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">
            {display_name}
          </span>
          <ChevronsUpDownIcon className="hidden size-4 text-muted-foreground sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 rounded-xl" side="bottom" sideOffset={8}>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <AccountAvatar account={active} className="size-8" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{display_name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {account_secondary_line(active)}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        {other_accounts.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            {other_accounts.map((account) => (
              <DropdownMenuItem
                key={account.login}
                onClick={() => void switch_account(account.login)}
              >
                <AccountAvatar account={account} className="size-4" />
                <span className="truncate">{account_display_name(account)}</span>
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void start_add_account()}>
          <PlusIcon />
          {intl.formatMessage({ id: 'account.add' })}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void logout_account()}>
          <LogOutIcon />
          {intl.formatMessage({ id: 'account.logout' })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const AccountMenu = connector(Wrapper)
