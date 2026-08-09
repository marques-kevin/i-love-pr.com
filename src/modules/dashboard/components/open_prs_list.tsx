import { differenceInDays, formatDistanceToNow, parseISO } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { useIntl } from 'react-intl'
import { Badge } from '@/components/ui/badge'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './open_prs_list.connector'

export function Wrapper({ prs }: ConnectorProps) {
  const intl = useIntl()
  const date_locale = intl.locale.startsWith('fr') ? fr : enUS
  if (!prs) return null

  return (
    <Panel title={intl.formatMessage({ id: 'chart.open_prs.title' })}>
      {prs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No open pull requests in the selected scope.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {prs.map((pr) => {
            const age_days = differenceInDays(new Date(), parseISO(pr.created_at))
            const stale = age_days >= 7
            return (
              <li
                key={pr.pr_id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <a
                    href={`https://github.com/${pr.repo_full_name}/pull/${pr.pr_number}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground hover:text-primary"
                  >
                    #{pr.pr_number} {pr.title}
                  </a>
                  <p className="text-sm text-muted-foreground">
                    {pr.repo_full_name} · @{pr.author} · {pr.lines_changed} lines
                  </p>
                </div>
                <Badge variant={stale ? 'destructive' : 'secondary'}>
                  {formatDistanceToNow(parseISO(pr.created_at), {
                    addSuffix: true,
                    locale: date_locale,
                  })}
                  {stale ? ' · stale' : ''}
                </Badge>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

export const OpenPRsList = connector(Wrapper)
