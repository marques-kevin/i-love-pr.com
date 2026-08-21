import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { PlusSignIcon } from '@/components/icons/plus_sign'
import { Button } from '@/components/ui/button'
import { account_display_name, account_secondary_line } from '@/lib/session'
import { connector, type ConnectorProps } from './account_picker.connector'

function initials(login: string, name: string | null): string {
  const source = name?.trim() || login
  return source.slice(0, 2).toUpperCase()
}

export function Wrapper({ accounts, switch_account, start_add_account }: ConnectorProps) {
  const intl = useIntl()

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {intl.formatMessage({ id: 'account.picker.title' })}
        </h1>
        <p className="text-base-content/60 mt-1 text-sm">
          {intl.formatMessage({ id: 'account.picker.description' })}
        </p>
      </div>

      <ul className="space-y-2">
        {accounts.map((account) => (
          <li key={account.login}>
            <button
              type="button"
              className="hover:bg-base-200 flex w-full items-center gap-3 rounded-lg border border-base-300 bg-base-100 px-3 py-3 text-left transition-colors"
              data-cuelume-press=""
              data-cuelume-release=""
              onClick={() => void switch_account(account.login)}
            >
              <div className="avatar">
                <div className="bg-neutral text-neutral-content w-10 rounded-full">
                  {account.avatar_url ? (
                    <img src={account.avatar_url} alt="" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-xs font-semibold">
                      {initials(account.login, account.name)}
                    </span>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{account_display_name(account)}</p>
                <p className="text-base-content/60 truncate text-xs">
                  {account_secondary_line(account)}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        className="btn-outline mt-4 w-full"
        onClick={() => void start_add_account()}
      >
        <HoverIcon icon={PlusSignIcon} size={16} />
        {intl.formatMessage({ id: 'account.add' })}
      </Button>
    </div>
  )
}

export const AccountPicker = connector(Wrapper)
