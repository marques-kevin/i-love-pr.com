import { differenceInDays, formatDistanceToNow, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './open_prs_list.connector'

export function Wrapper({ prs }: ConnectorProps) {
  if (!prs) return null

  return (
    <Panel title="Open pull requests">
      {prs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No open pull requests in the selected scope.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {prs.map((pr) => {
            const age_days = differenceInDays(new Date(), parseISO(pr.createdAt))
            const stale = age_days >= 7
            return (
              <li
                key={pr.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <a
                    href={`https://github.com/${pr.repoFullName}/pull/${pr.number}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground hover:text-primary"
                  >
                    #{pr.number} {pr.title}
                  </a>
                  <p className="text-sm text-muted-foreground">
                    {pr.repoFullName} · @{pr.author} · {pr.linesChanged} lines
                  </p>
                </div>
                <Badge variant={stale ? 'destructive' : 'secondary'}>
                  {formatDistanceToNow(parseISO(pr.createdAt), { addSuffix: true })}
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
