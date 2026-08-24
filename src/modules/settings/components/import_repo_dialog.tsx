import { useState } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { strip_share_link_from_browser_location } from '@/lib/repo_snapshot'
import type { MessageKey } from '@/lib/i18n/messages/en'
import { connector, type ConnectorProps } from './import_repo_dialog.connector'

function import_step_label_id(step: ConnectorProps['import_job']['step']): MessageKey {
  if (step === 'download') return 'app.nav.import_repository_step_download'
  if (step === 'prs') return 'app.nav.import_repository_step_write'
  if (step === 'facts') return 'app.nav.import_repository_step_facts'
  return 'app.nav.import_repository_importing'
}

export function Wrapper({
  on_close,
  import_repo_link,
  import_job,
  import_repo_snapshot_from_link,
}: ConnectorProps & { on_close: () => void }) {
  const intl = useIntl()
  const [share_link, set_share_link] = useState(import_repo_link ?? '')
  const importing = import_job.status === 'running'
  const dialog_key = import_repo_link ?? 'manual'

  function handle_close() {
    strip_share_link_from_browser_location()
    on_close()
  }

  function handle_import() {
    const link = share_link.trim()
    if (!link || importing) return
    strip_share_link_from_browser_location()
    on_close()
    void import_repo_snapshot_from_link({ share_link: link })
  }

  const progress_visible = importing && import_job.step !== null
  const display_error = import_job.status === 'error' ? import_job.error : null

  return (
    <Modal key={dialog_key} open on_close={handle_close} box_className="max-w-lg">
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

      {progress_visible ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{intl.formatMessage({ id: import_step_label_id(import_job.step) })}</span>
            <span className="tabular-nums">{import_job.percent}%</span>
          </div>
          <progress
            className="progress progress-primary w-full"
            value={import_job.percent}
            max={100}
          />
          {import_job.repo_full_name ? (
            <p className="text-base-content/60 text-xs">{import_job.repo_full_name}</p>
          ) : null}
        </div>
      ) : null}

      {display_error ? <p className="text-error mt-3 text-sm">{display_error}</p> : null}

      <div className="modal-action">
        <Button type="button" className="btn-outline" disabled={importing} onClick={handle_close}>
          {intl.formatMessage({ id: 'app.nav.import_repository_cancel' })}
        </Button>
        <Button
          type="button"
          className="btn-primary"
          disabled={importing || share_link.trim().length === 0}
          onClick={() => void handle_import()}
        >
          {importing
            ? intl.formatMessage({ id: import_step_label_id(import_job.step) })
            : intl.formatMessage({ id: 'app.nav.import_repository_confirm' })}
        </Button>
      </div>
    </Modal>
  )
}

export const ImportRepoDialog = connector(Wrapper)
