import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PeriodKey } from '@/lib/types'
import { connector, type ConnectorProps } from './period_filter.connector'

export function Wrapper({
  period_key,
  custom_from,
  custom_to,
  set_period_key,
  set_custom_from,
  set_custom_to,
}: ConnectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tabs value={period_key} onValueChange={(v) => set_period_key(v as PeriodKey)}>
        <TabsList>
          {(['7d', '30d', '90d', 'custom'] as PeriodKey[]).map((key) => (
            <TabsTrigger key={key} value={key}>
              {key}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
