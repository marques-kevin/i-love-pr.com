import { useState } from 'react'
import { FilterIcon } from 'lucide-react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
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
      <Button type="button" className="btn-outline btn-sm" onClick={() => set_open(true)}>
        <FilterIcon className="size-4" />
        {intl.formatMessage({ id: 'dashboard.filters' })}
        {count > 0 ? <span className="badge badge-sm badge-neutral">{count}</span> : null}
      </Button>

      <Modal
        open={open}
        on_close={() => set_open(false)}
        placement="end"
        box_className="h-full max-h-none w-full max-w-md rounded-none"
      >
        <h3 className="font-display text-lg font-semibold">
          {intl.formatMessage({ id: 'dashboard.filters.title' })}
        </h3>
        <p className="text-base-content/60 mt-1 text-sm">
          {intl.formatMessage({ id: 'dashboard.filters.description' })}
        </p>

        <div className="mt-6 flex min-h-0 flex-1 flex-col gap-8">
          <section className="space-y-3">
            <h4 className="text-sm font-medium">
              {intl.formatMessage({ id: 'dashboard.filters.members' })}
            </h4>
            <MemberFilter />
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-medium">
              {intl.formatMessage({ id: 'dashboard.filters.test_files' })}
            </h4>
            <TestFilesFilter />
          </section>
        </div>
      </Modal>
    </>
  )
}

export const DashboardFilters = connector(Wrapper)
