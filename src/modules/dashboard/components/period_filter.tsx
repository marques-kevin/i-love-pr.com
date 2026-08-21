import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { period_message_key } from '@/lib/i18n'
import { normalize_period_key } from '@/lib/dashboard_layout'
import { cn } from '@/lib/utils'
import { connector, type ConnectorProps } from './period_filter.connector'

export function Wrapper({
  period_key,
  custom_from,
  custom_to,
  set_period_key,
  set_custom_from,
  set_custom_to,
}: ConnectorProps) {
  const intl = useIntl()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="join overflow-x-auto">
        {(['7d', '30d', '90d', 'custom'] as const).map((key) => (
          <Button
            key={key}
            type="button"
            className={cn('btn-sm join-item', period_key === key ? 'btn-primary' : 'btn-outline')}
            aria-pressed={period_key === key}
            onClick={() => set_period_key(normalize_period_key(key))}
          >
            {intl.formatMessage({ id: period_message_key(key) })}
          </Button>
        ))}
      </div>

      {period_key === 'custom' && (
        <div className="flex gap-2">
          <Input
            type="date"
            value={custom_from}
            onChange={(e) => set_custom_from(e.target.value)}
            className="w-auto"
          />
          <Input
            type="date"
            value={custom_to}
            onChange={(e) => set_custom_to(e.target.value)}
            className="w-auto"
          />
        </div>
      )}
    </div>
  )
}

export const PeriodFilter = connector(Wrapper)
