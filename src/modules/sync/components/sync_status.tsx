import { formatDistanceToNow, parseISO } from 'date-fns'
import { RefreshCwIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { connector, type ConnectorProps } from './sync_status.connector'

export function Wrapper({
  syncing,
  progress,
  rate_limit,
  sync_states,
  error,
  run_sync,
}: ConnectorProps) {
  const last_synced = sync_states
    .map((s) => s.last_synced_at)
    .filter(Boolean)
    .sort()
    .at(-1)

  const paused_error = sync_states.find((s) => s.last_error)?.last_error
  const is_backfilling = syncing && (progress?.mode === 'backfill' || progress?.mode === 'paused')
  const has_more_history = sync_states.some((s) => Boolean(s.page_cursor))

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          {syncing
            ? (progress?.message ?? 'Syncing…')
            : last_synced
              ? `Last sync ${formatDistanceToNow(parseISO(last_synced), { addSuffix: true })}`
              : 'Never synced'}
        </span>
        {rate_limit && (
          <Badge variant="secondary">
            API {rate_limit.remaining}/{rate_limit.limit}
          </Badge>
        )}
        {!syncing && has_more_history && <Badge variant="outline">More history available</Badge>}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void run_sync({ force: true })}
          disabled={syncing}
          title="Pull the next batch of PRs. Re-run after the rate limit resets to go deeper into history."
        >
          <RefreshCwIcon className={syncing ? 'animate-spin' : undefined} />
          {syncing
            ? is_backfilling
              ? 'Backfilling…'
              : 'Syncing…'
            : has_more_history
              ? 'Sync more history'
              : 'Sync history'}
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
