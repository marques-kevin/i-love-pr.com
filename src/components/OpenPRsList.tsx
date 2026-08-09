import { differenceInDays, formatDistanceToNow, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import type { EnrichedPullRequest } from '@/lib/types'

export function OpenPRsList({ prs }: { prs: EnrichedPullRequest[] }) {
  if (prs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No open pull requests in the selected scope.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {prs.map((pr) => {
        const ageDays = differenceInDays(new Date(), parseISO(pr.createdAt))
        const stale = ageDays >= 7
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
  )
}
