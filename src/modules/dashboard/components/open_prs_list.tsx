import { useState } from 'react'
import { differenceInDays, formatDistanceToNow, parseISO } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { useIntl } from 'react-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './open_prs_list.connector'

const PAGE_SIZE = 10

export function Wrapper({ prs }: ConnectorProps) {
  const intl = useIntl()
  const date_locale = intl.locale.startsWith('fr') ? fr : enUS
  const [page, set_page] = useState(1)

  if (!prs) return null

  const total_pages = Math.max(1, Math.ceil(prs.length / PAGE_SIZE))
  const current_page = Math.min(page, total_pages)
  const start_index = (current_page - 1) * PAGE_SIZE
  const page_items = prs.slice(start_index, start_index + PAGE_SIZE)
  const from = prs.length === 0 ? 0 : start_index + 1
  const to = Math.min(start_index + PAGE_SIZE, prs.length)

  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.open_prs.title' })}
      help={intl.formatMessage({ id: 'chart.open_prs.help' })}
    >
      {prs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'open_prs.empty' })}
        </p>
      ) : (
        <div className="space-y-4">
          <ul className="divide-y divide-border">
            {page_items.map((pr) => {
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
                      {intl.formatMessage(
                        { id: 'open_prs.meta' },
                        {
                          repo: pr.repo_full_name,
                          author: pr.author,
                          lines: pr.lines_changed,
                        },
                      )}
                    </p>
                  </div>
                  <Badge variant={stale ? 'destructive' : 'secondary'}>
                    {formatDistanceToNow(parseISO(pr.created_at), {
                      addSuffix: true,
                      locale: date_locale,
                    })}
                    {stale ? ` · ${intl.formatMessage({ id: 'open_prs.stale' })}` : ''}
                  </Badge>
                </li>
              )
            })}
          </ul>

          {total_pages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {intl.formatMessage({ id: 'open_prs.range' }, { from, to, count: prs.length })}
                <span className="mx-2 text-border">·</span>
                {intl.formatMessage(
                  { id: 'open_prs.page' },
                  { page: current_page, total: total_pages },
                )}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={current_page <= 1}
                  onClick={() => set_page(current_page - 1)}
                >
                  {intl.formatMessage({ id: 'open_prs.prev' })}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={current_page >= total_pages}
                  onClick={() => set_page(current_page + 1)}
                >
                  {intl.formatMessage({ id: 'open_prs.next' })}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}

export const OpenPRsList = connector(Wrapper)
