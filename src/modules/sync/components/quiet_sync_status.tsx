import { formatDistanceToNow, parseISO } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { RefreshIcon } from '@/components/icons/refresh'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { connector, type ConnectorProps } from './quiet_sync_status.connector'

export function Wrapper({
  syncing,
  progress,
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
    .map((state) => state.last_synced_at)
    .filter(Boolean)
    .sort()
    .at(-1)

  const paused_error = active_states.find((state) => state.last_error)?.last_error

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

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="text-base-content/60 flex items-center gap-2 text-sm">
        <span className="hidden max-w-56 truncate sm:inline">{status_label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              className="btn-ghost btn-circle btn-sm"
              onClick={() =>
                void run_sync({
                  force: true,
                  repos: active_repo ? [active_repo] : [],
                })
              }
              disabled={syncing || !active_repo}
              aria-label={intl.formatMessage({ id: 'sync.tooltip' })}
            >
              <HoverIcon
                icon={RefreshIcon}
                size={16}
                icon_className={active_syncing ? 'animate-spin' : undefined}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{status_label}</TooltipContent>
        </Tooltip>
      </div>
      {error ? (
        <div role="alert" className="alert alert-error max-w-xs py-1 text-xs">
          <span>{error}</span>
        </div>
      ) : null}
      {!error && paused_error ? (
        <div role="alert" className="alert max-w-xs py-1 text-xs">
          <span>{paused_error}</span>
        </div>
      ) : null}
    </div>
  )
}

export const QuietSyncStatus = connector(Wrapper)
