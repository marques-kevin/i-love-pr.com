import { useIntl } from 'react-intl'
import { connector, type ConnectorProps } from './test_files_filter.connector'

export function Wrapper({ hide_test_files, set_hide_test_files }: ConnectorProps) {
  const intl = useIntl()

  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <label
          htmlFor="hide-test-files"
          className="label min-w-0 cursor-pointer justify-start p-0 whitespace-normal"
        >
          {intl.formatMessage({ id: 'dashboard.filters.hide_test_files' })}
        </label>
        <p className="text-base-content/60 mt-1 text-xs">
          {intl.formatMessage({ id: 'dashboard.filters.hide_test_files_help' })}
        </p>
      </div>
      <input
        id="hide-test-files"
        type="checkbox"
        className="toggle toggle-primary shrink-0"
        checked={hide_test_files}
        onChange={(event) => set_hide_test_files(event.target.checked)}
      />
    </div>
  )
}

export const TestFilesFilter = connector(Wrapper)
