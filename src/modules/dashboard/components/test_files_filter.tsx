import { useIntl } from 'react-intl'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { connector, type ConnectorProps } from './test_files_filter.connector'

export function Wrapper({ hide_test_files, set_hide_test_files }: ConnectorProps) {
  const intl = useIntl()

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label htmlFor="hide-test-files">
          {intl.formatMessage({ id: 'dashboard.filters.hide_test_files' })}
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">
          {intl.formatMessage({ id: 'dashboard.filters.hide_test_files_help' })}
        </p>
      </div>
      <Switch
        id="hide-test-files"
        checked={hide_test_files}
        onCheckedChange={set_hide_test_files}
      />
    </div>
  )
}

export const TestFilesFilter = connector(Wrapper)
