import { format, parseISO } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { CalendarRangeIcon } from 'lucide-react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { compute_sync_depth_progress, min_remote_oldest_created_at } from '@/lib/pr_coverage'
import type { SyncState } from '@/lib/types'
import { connector, type ConnectorProps } from './sync_coverage.connector'

function is_history_complete(active_repo: string | null, sync_states: SyncState[]): boolean {
  if (!active_repo) return false
  const state = sync_states.find((item) => item.repo_full_name === active_repo)
  if (!state) return false
  if (state.page_cursor != null) return false
  return Boolean(state.last_synced_at) || state.total_fetched > 0
}

export function Wrapper({ pr_coverage, sync_states, active_repo }: ConnectorProps) {
  const intl = useIntl()
  const date_locale = intl.locale.startsWith('fr') ? fr : enUS

  const selected_states = sync_states.filter((state) => state.repo_full_name === active_repo)
  const remote_oldest_created_at = min_remote_oldest_created_at(
    selected_states.map((state) => state.remote_oldest_created_at),
  )
  const history_complete = is_history_complete(active_repo, sync_states)
  const progress = compute_sync_depth_progress({
    local_oldest_created_at: pr_coverage?.oldest_created_at ?? null,
    local_newest_created_at: pr_coverage?.newest_created_at ?? null,
    remote_oldest_created_at,
    history_complete,
  })

  const target_oldest = remote_oldest_created_at ?? pr_coverage?.oldest_created_at ?? null
  const oldest_label = target_oldest
    ? format(parseISO(target_oldest), 'PP', { locale: date_locale })
    : null
  const newest_label = pr_coverage
    ? format(parseISO(pr_coverage.newest_created_at), 'PP', { locale: date_locale })
    : null
  const percent_label =
    progress == null
      ? null
      : intl.formatNumber(progress, { style: 'percent', maximumFractionDigits: 0 })

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          aria-label={intl.formatMessage({ id: 'sync.coverage.trigger_aria' })}
        >
          <CalendarRangeIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <PopoverHeader>
          <PopoverTitle>{intl.formatMessage({ id: 'sync.coverage.title' })}</PopoverTitle>
          {pr_coverage ? (
            <PopoverDescription>
              {intl.formatMessage({ id: 'sync.coverage.count' }, { count: pr_coverage.count })}
              {percent_label
                ? ` · ${intl.formatMessage({ id: 'sync.coverage.progress' }, { percent: percent_label })}`
                : ''}
            </PopoverDescription>
          ) : null}
        </PopoverHeader>
        {!pr_coverage ? (
          <p className="text-xs text-muted-foreground">
            {intl.formatMessage({ id: 'sync.coverage.empty' })}
          </p>
        ) : (
          <div className="space-y-2">
            <div
              className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress == null ? undefined : Math.round(progress * 100)}
              aria-label={intl.formatMessage(
                { id: 'sync.coverage.range_aria' },
                { oldest: oldest_label!, newest: newest_label! },
              )}
            >
              <div
                className="absolute inset-y-0 right-0 rounded-full bg-primary transition-[width] duration-500 ease-out"
                style={{ width: `${Math.round((progress ?? 0) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="text-muted-foreground">
                  {intl.formatMessage({
                    id: remote_oldest_created_at
                      ? 'sync.coverage.oldest_remote'
                      : 'sync.coverage.oldest',
                  })}
                </p>
                <p className="font-medium text-foreground">{oldest_label}</p>
              </div>
              <div className="min-w-0 text-right">
                <p className="text-muted-foreground">
                  {intl.formatMessage({ id: 'sync.coverage.newest' })}
                </p>
                <p className="font-medium text-foreground">{newest_label}</p>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export const SyncCoverage = connector(Wrapper)
