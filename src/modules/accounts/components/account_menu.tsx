import { ChevronsUpDownIcon, LogOutIcon, PlusIcon, UserRoundIcon } from 'lucide-react'
import { useIntl } from 'react-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
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
  const { isMobile } = useSidebar()
  const active = accounts.find((account) => account.login === active_login) ?? null

  if (!active) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton disabled tooltip={intl.formatMessage({ id: 'account.unknown' })}>
          <UserRoundIcon />
          <span>{intl.formatMessage({ id: 'account.unknown' })}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  const other_accounts = accounts.filter((account) => account.login !== active.login)

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            tooltip={account_display_name(active)}
            data-cuelume-press=""
            data-cuelume-release=""
          >
            <AccountAvatar account={active} className="size-8" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{account_display_name(active)}</span>
              <span className="truncate text-xs text-muted-foreground">
                {account_secondary_line(active)}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          side={isMobile ? 'bottom' : 'right'}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <AccountAvatar account={active} className="size-8" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{account_display_name(active)}</span>
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
    </SidebarMenuItem>
  )
}

export const AccountMenu = connector(Wrapper)
