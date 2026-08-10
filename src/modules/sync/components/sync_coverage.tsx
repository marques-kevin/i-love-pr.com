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
import { connector, type ConnectorProps } from './sync_coverage.connector'

export function Wrapper({ pr_coverage }: ConnectorProps) {
  const intl = useIntl()
  const date_locale = intl.locale.startsWith('fr') ? fr : enUS

  const oldest_label = pr_coverage
    ? format(parseISO(pr_coverage.oldest_created_at), 'PP', { locale: date_locale })
    : null
  const newest_label = pr_coverage
    ? format(parseISO(pr_coverage.newest_created_at), 'PP', { locale: date_locale })
    : null

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
      <PopoverContent align="end" className="w-64">
        <PopoverHeader>
          <PopoverTitle>{intl.formatMessage({ id: 'sync.coverage.title' })}</PopoverTitle>
          {pr_coverage ? (
            <PopoverDescription>
              {intl.formatMessage({ id: 'sync.coverage.count' }, { count: pr_coverage.count })}
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
              className="h-1.5 w-full rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/60"
              role="img"
              aria-label={intl.formatMessage(
                { id: 'sync.coverage.range_aria' },
                { oldest: oldest_label!, newest: newest_label! },
              )}
            />
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="text-muted-foreground">
                  {intl.formatMessage({ id: 'sync.coverage.oldest' })}
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
