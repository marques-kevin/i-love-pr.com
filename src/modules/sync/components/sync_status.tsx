import { formatDistanceToNow, parseISO } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { RefreshCwIcon } from 'lucide-react'
import { useIntl } from 'react-intl'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SyncCoverage } from './sync_coverage'
import { connector, type ConnectorProps } from './sync_status.connector'

export function Wrapper({
  syncing,
  progress,
  rate_limit,
  sync_states,
  error,
  active_repo,
  run_sync,
}: ConnectorProps) {
  const intl = useIntl()
  const date_locale = intl.locale.startsWith('fr') ? fr : enUS

  const active_states = sync_states.filter((state) => state.repo_full_name === active_repo)
  const active_progress = progress && progress.repo_full_name === active_repo ? progress : null
  const active_syncing = Boolean(
    syncing && (active_progress || active_states.some((state) => state.mode !== 'idle')),
  )

  const last_synced = active_states
    .map((s) => s.last_synced_at)
    .filter(Boolean)
    .sort()
    .at(-1)

  const paused_error = active_states.find((s) => s.last_error)?.last_error
  const is_backfilling =
    active_syncing && (active_progress?.mode === 'backfill' || active_progress?.mode === 'paused')
  const has_more_history = active_states.some((s) => Boolean(s.page_cursor))

  const status_label = active_syncing
    ? (active_progress?.message ?? intl.formatMessage({ id: 'sync.syncing' }))
    : last_synced
      ? intl.formatMessage(
          { id: 'sync.last' },
          {
            relative: formatDistanceToNow(parseISO(last_synced), {
              addSuffix: true,
              locale: date_locale,
            }),
          },
        )
      : intl.formatMessage({ id: 'sync.never' })

  const button_label = active_syncing
    ? is_backfilling
      ? intl.formatMessage({ id: 'sync.backfilling' })
      : intl.formatMessage({ id: 'sync.syncing' })
    : has_more_history
      ? intl.formatMessage({ id: 'sync.sync_more' })
      : intl.formatMessage({ id: 'sync.sync_history' })

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>{status_label}</span>
        {rate_limit && (
          <Badge variant="secondary">
            {intl.formatMessage(
              { id: 'sync.api' },
              { remaining: rate_limit.remaining, limit: rate_limit.limit },
            )}
          </Badge>
        )}
        <SyncCoverage />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            void run_sync({
              force: true,
              repos: active_repo ? [active_repo] : [],
            })
          }
          disabled={syncing || !active_repo}
          title={intl.formatMessage({ id: 'sync.tooltip' })}
        >
          <RefreshCwIcon className={active_syncing ? 'animate-spin' : undefined} />
          {button_label}
        </Button>
      </div>
      {error && (
        <Alert variant="destructive" className="max-w-md py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!error && paused_error && (
        <Alert className="max-w-md py-2">
          <AlertDescription>{paused_error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export const SyncStatus = connector(Wrapper)
