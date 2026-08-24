import { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ImportProgressView } from '@/modules/settings/components/import_progress_view'
import { connector, type ConnectorProps } from './import_repo_dialog.connector'

export function Wrapper({
  on_close,
  import_repo_link,
  import_job,
  start_repo_import,
  dismiss_import_job,
}: ConnectorProps & { on_close: () => void }) {
  const intl = useIntl()
  const [share_link, set_share_link] = useState(import_repo_link ?? '')
  const [error, set_error] = useState<string | null>(null)
  const importing = import_job?.status === 'running'
  const active_import_link = import_job?.share_link ?? null

  useEffect(() => {
    if (import_repo_link) {
      set_share_link(import_repo_link)
    }
  }, [import_repo_link])

  useEffect(() => {
    if (import_job?.status === 'failed') {
      set_error(import_job.error)
    }
    if (import_job?.status === 'succeeded') {
      set_share_link('')
      set_error(null)
      on_close()
    }
  }, [import_job, on_close])

  function handle_import() {
    const link = share_link.trim()
    if (!link || importing) return
    set_error(null)
    start_repo_import({ share_link: link })
  }

  function handle_close() {
    if (import_job?.status === 'failed') {
      dismiss_import_job()
    }
    on_close()
  }

  const show_progress =
    importing && active_import_link != null && active_import_link === share_link.trim()

  return (
    <Modal open on_close={handle_close} box_className="max-w-lg">
      <h3 className="font-display text-lg font-semibold">
        {intl.formatMessage({ id: 'app.nav.import_repository_title' })}
      </h3>
      <p className="text-base-content/60 mt-1 text-sm">
        {intl.formatMessage({ id: 'app.nav.import_repository_description' })}
      </p>

      <label className="form-control mt-4 w-full">
        <span className="label">
          {intl.formatMessage({ id: 'app.nav.import_repository_label' })}
        </span>
        <Input
          id="home-import-link"
          value={share_link}
          onChange={(event) => set_share_link(event.target.value)}
          placeholder={intl.formatMessage({ id: 'app.nav.import_repository_placeholder' })}
          disabled={importing}
        />
      </label>

      {show_progress && import_job ? (
        <ImportProgressView import_job={import_job} className="mt-4" />
      ) : null}

      {error ? <p className="text-error mt-3 text-sm">{error}</p> : null}

      <div className="modal-action">
        <Button type="button" className="btn-outline" onClick={handle_close}>
          {importing
            ? intl.formatMessage({ id: 'app.nav.import_repository_close' })
            : intl.formatMessage({ id: 'app.nav.import_repository_cancel' })}
        </Button>
        <Button
          type="button"
          className="btn-primary"
          disabled={importing || share_link.trim().length === 0}
          onClick={() => handle_import()}
        >
          {importing
            ? intl.formatMessage({ id: 'app.nav.import_repository_importing' })
            : intl.formatMessage({ id: 'app.nav.import_repository_confirm' })}
        </Button>
      </div>
    </Modal>
  )
}

export const ImportRepoDialog = connector(Wrapper)
