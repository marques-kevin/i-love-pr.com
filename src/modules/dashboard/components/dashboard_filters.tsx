import { useState } from 'react'
import { FilterIcon } from 'lucide-react'
import { useIntl } from 'react-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { connector, type ConnectorProps } from './dashboard_filters.connector'
import { MemberFilter } from './member_filter'
import { TestFilesFilter } from './test_files_filter'

function active_filter_count({ members, hide_test_files }: ConnectorProps) {
  let count = 0
  if (members.length > 0) count += 1
  if (hide_test_files) count += 1
  return count
}

export function Wrapper(props: ConnectorProps) {
  const intl = useIntl()
  const [open, set_open] = useState(false)
  const count = active_filter_count(props)

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => set_open(true)}>
        <FilterIcon className="size-4" />
        {intl.formatMessage({ id: 'dashboard.filters' })}
        {count > 0 && (
          <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5">
            {count}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={set_open}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>{intl.formatMessage({ id: 'dashboard.filters.title' })}</SheetTitle>
            <SheetDescription>
              {intl.formatMessage({ id: 'dashboard.filters.description' })}
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-4">
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                {intl.formatMessage({ id: 'dashboard.filters.members' })}
              </h3>
              <MemberFilter />
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                {intl.formatMessage({ id: 'dashboard.filters.test_files' })}
              </h3>
              <TestFilesFilter />
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export const DashboardFilters = connector(Wrapper)
