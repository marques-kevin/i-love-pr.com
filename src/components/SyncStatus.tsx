import { formatDistanceToNow, parseISO } from 'date-fns'
import { RefreshCwIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { RateLimitInfo, SyncProgress, SyncState } from '@/lib/types'

interface SyncStatusProps {
  syncing: boolean
  progress: SyncProgress | null
  rateLimit: RateLimitInfo | null
  syncStates: SyncState[]
  error: string | null
  onRefresh: () => void
}

export function SyncStatus({
  syncing,
  progress,
  rateLimit,
  syncStates,
  error,
  onRefresh,
}: SyncStatusProps) {
  const lastSynced = syncStates
    .map((s) => s.lastSyncedAt)
    .filter(Boolean)
    .sort()
    .at(-1)

  const pausedError = syncStates.find((s) => s.lastError)?.lastError
  const isBackfilling =
    syncing && (progress?.mode === 'backfill' || progress?.mode === 'paused')
  const hasMoreHistory = syncStates.some((s) => Boolean(s.pageCursor))

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          {syncing
            ? (progress?.message ?? 'Syncing…')
            : lastSynced
              ? `Last sync ${formatDistanceToNow(parseISO(lastSynced), { addSuffix: true })}`
              : 'Never synced'}
        </span>
        {rateLimit && (
          <Badge variant="secondary">
            API {rateLimit.remaining}/{rateLimit.limit}
          </Badge>
        )}
        {!syncing && hasMoreHistory && (
          <Badge variant="outline">More history available</Badge>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={syncing}
          title="Pull the next batch of PRs. Re-run after the rate limit resets to go deeper into history."
        >
          <RefreshCwIcon className={syncing ? 'animate-spin' : undefined} />
          {syncing
            ? isBackfilling
              ? 'Backfilling…'
              : 'Syncing…'
            : hasMoreHistory
              ? 'Sync more history'
              : 'Sync history'}
        </Button>
      </div>
      {error && (
        <Alert variant="destructive" className="max-w-md py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!error && pausedError && (
        <Alert className="max-w-md py-2">
          <AlertDescription>{pausedError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
