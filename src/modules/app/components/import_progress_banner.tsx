import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { ImportProgressView } from '@/modules/settings/components/import_progress_view'
import { connector, type ConnectorProps } from './import_progress_banner.connector'

export function Wrapper({ import_job, dismiss_import_job }: ConnectorProps) {
  const intl = useIntl()

  if (!import_job) return null

  if (import_job.status === 'running') {
    return (
      <div
        role="status"
        className="card bg-base-100 ring-primary/20 rounded-3xl shadow-none ring-1"
      >
        <div className="card-body gap-3 p-5">
          <ImportProgressView import_job={import_job} />
          <p className="text-base-content/60 text-xs">
            {intl.formatMessage({ id: 'app.nav.import_repository_background_hint' })}
          </p>
        </div>
      </div>
    )
  }

  if (import_job.status === 'failed') {
    return (
      <div role="alert" className="alert alert-error">
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {intl.formatMessage({ id: 'app.nav.import_repository_failed' })}
          </p>
          <p className="text-sm opacity-90">{import_job.error}</p>
        </div>
        <Button type="button" className="btn-ghost btn-sm" onClick={dismiss_import_job}>
          {intl.formatMessage({ id: 'app.nav.import_repository_dismiss' })}
        </Button>
      </div>
    )
  }

  return (
    <div role="status" className="alert alert-success">
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {intl.formatMessage(
            { id: 'app.nav.import_repository_succeeded' },
            { repo: import_job.repo_full_name ?? '' },
          )}
        </p>
      </div>
      <Button type="button" className="btn-ghost btn-sm" onClick={dismiss_import_job}>
        {intl.formatMessage({ id: 'app.nav.import_repository_dismiss' })}
      </Button>
    </div>
  )
}

export const ImportProgressBanner = connector(Wrapper)
