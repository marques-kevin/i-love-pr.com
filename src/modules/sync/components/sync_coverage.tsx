import { format, parseISO } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { useIntl } from 'react-intl'
import { Panel } from '@/modules/dashboard/components/panel'
import { connector, type ConnectorProps } from './sync_coverage.connector'

export function Wrapper({ pr_coverage }: ConnectorProps) {
  const intl = useIntl()
  const date_locale = intl.locale.startsWith('fr') ? fr : enUS

  if (!pr_coverage) {
    return (
      <Panel title={intl.formatMessage({ id: 'sync.coverage.title' })}>
        <p className="text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'sync.coverage.empty' })}
        </p>
      </Panel>
    )
  }

  const oldest_label = format(parseISO(pr_coverage.oldest_created_at), 'PP', {
    locale: date_locale,
  })
  const newest_label = format(parseISO(pr_coverage.newest_created_at), 'PP', {
    locale: date_locale,
  })

  return (
    <Panel
      title={intl.formatMessage({ id: 'sync.coverage.title' })}
      description={intl.formatMessage({ id: 'sync.coverage.count' }, { count: pr_coverage.count })}
      help={intl.formatMessage({ id: 'sync.coverage.help' })}
    >
      <div className="space-y-3">
        <div
          className="h-2.5 w-full rounded-full bg-gradient-to-r from-primary/70 via-primary to-primary/70"
          role="img"
          aria-label={intl.formatMessage(
            { id: 'sync.coverage.range_aria' },
            { oldest: oldest_label, newest: newest_label },
          )}
        />
        <div className="flex items-start justify-between gap-4 text-sm">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {intl.formatMessage({ id: 'sync.coverage.oldest' })}
            </p>
            <p className="font-medium text-foreground">{oldest_label}</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {intl.formatMessage({ id: 'sync.coverage.newest' })}
            </p>
            <p className="font-medium text-foreground">{newest_label}</p>
          </div>
        </div>
      </div>
    </Panel>
  )
}

export const SyncCoverage = connector(Wrapper)
