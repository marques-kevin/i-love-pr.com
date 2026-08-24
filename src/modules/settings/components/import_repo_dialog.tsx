import { useState } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import type { ImportJobStep } from '@/lib/import_job_progress'
import { ImportProgress } from './import_progress'
import { connector, type ConnectorProps } from './import_repo_dialog.connector'

function step_message_id(step: ImportJobStep | null) {
  if (step === 'prs') return 'app.nav.import_repository_step_prs' as const
  if (step === 'facts') return 'app.nav.import_repository_step_facts' as const
  return 'app.nav.import_repository_step_download' as const
}

export function Wrapper({
  on_close,
  import_repo_link,
  import_job,
  import_repo_snapshot_from_link,
  strip_share_link,
}: ConnectorProps & { on_close: () => void }) {
  const intl = useIntl()
  const [share_link, set_share_link] = useState(import_repo_link ?? '')
  const running = import_job.status === 'running'
  const failed = import_job.status === 'error'

  function handle_import() {
    const link = share_link.trim()
    if (!link || running) return
    strip_share_link()
    void import_repo_snapshot_from_link({ share_link: link })
  }

  function handle_cancel() {
    strip_share_link()
    on_close()
  }

  return (
    <Modal open on_close={handle_cancel} box_className="max-w-lg">
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
          disabled={running}
        />
      </label>

      {running ? (
        <ImportProgress
          step_label={intl.formatMessage({ id: step_message_id(import_job.step) })}
          percent={import_job.percent}
        />
      ) : null}

      {failed ? (
        <p className="text-error mt-3 text-sm">
          {import_job.error ?? intl.formatMessage({ id: 'app.nav.import_repository_failed' })}
        </p>
      ) : null}

      <div className="modal-action">
        <Button type="button" className="btn-outline" onClick={handle_cancel}>
          {intl.formatMessage({ id: 'app.nav.import_repository_cancel' })}
        </Button>
        <Button
          type="button"
          className="btn-primary"
          disabled={running || share_link.trim().length === 0}
          onClick={handle_import}
        >
          {running
            ? intl.formatMessage({ id: 'app.nav.import_repository_importing' })
            : intl.formatMessage({ id: 'app.nav.import_repository_confirm' })}
        </Button>
      </div>
    </Modal>
  )
}

export const ImportRepoDialog = connector(Wrapper)
