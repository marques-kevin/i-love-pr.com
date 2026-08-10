import { useIntl } from 'react-intl'
import { PlusIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { account_display_name, account_secondary_line } from '@/lib/session'
import { LocaleSwitcher } from '@/modules/i18n'
import { connector, type ConnectorProps } from './account_picker.connector'

function initials(login: string, name: string | null): string {
  const source = name?.trim() || login
  return source.slice(0, 2).toUpperCase()
}

export function Wrapper({ accounts, switch_account, start_add_account }: ConnectorProps) {
  const intl = useIntl()

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {intl.formatMessage({ id: 'account.picker.title' })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'account.picker.description' })}
          </p>
        </div>
        <LocaleSwitcher />
      </div>

      <ul className="space-y-2">
        {accounts.map((account) => (
          <li key={account.login}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 text-left transition-colors hover:bg-accent"
              data-cuelume-press=""
              data-cuelume-release=""
              onClick={() => void switch_account(account.login)}
            >
              <Avatar className="size-10">
                {account.avatar_url ? <AvatarImage src={account.avatar_url} alt="" /> : null}
                <AvatarFallback>{initials(account.login, account.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {account_display_name(account)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {account_secondary_line(account)}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="outline"
        className="mt-4 w-full"
        data-cuelume-press=""
        data-cuelume-release=""
        onClick={() => void start_add_account()}
      >
        <PlusIcon />
        {intl.formatMessage({ id: 'account.add' })}
      </Button>
    </div>
  )
}

export const AccountPicker = connector(Wrapper)
