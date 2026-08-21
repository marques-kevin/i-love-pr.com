import { useState } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { connector, type ConnectorProps } from './import_snapshot_dialog.connector'

export function Wrapper({
  open,
  prefill_link,
  on_close,
  import_repo_snapshot_from_link,
  set_active_repo,
  refresh_metrics,
  run_sync,
}: ConnectorProps) {
  const intl = useIntl()
  const [import_link, set_import_link] = useState(prefill_link)
  const [busy, set_busy] = useState(false)
  const [message, set_message] = useState<string | null>(null)
  const [error, set_error] = useState<string | null>(null)

  async function handle_import() {
    const link = import_link.trim()
    if (!link) return
    set_busy(true)
    set_message(null)
    set_error(null)
    try {
      const result = await import_repo_snapshot_from_link({ share_link: link }).unwrap()
      await set_active_repo(result.repo_full_name)
      set_message(
        intl.formatMessage(
          { id: 'app.nav.import_done' },
          { repo: result.repo_full_name, count: result.pr_count },
        ),
      )
      void refresh_metrics()
      void run_sync({ force: false })
      on_close()
    } catch (err) {
      set_error(
        err instanceof Error ? err.message : intl.formatMessage({ id: 'app.nav.import_failed' }),
      )
    } finally {
      set_busy(false)
    }
  }

  return (
    <Modal open={open} on_close={on_close} box_className="max-w-lg">
      <h3 className="font-display text-lg font-semibold">
        {intl.formatMessage({ id: 'app.nav.import_title' })}
      </h3>
      <p className="text-base-content/60 mt-1 text-sm">
        {intl.formatMessage({ id: 'app.nav.import_description' })}
      </p>

      <label className="form-control mt-4 w-full">
        <span className="label">{intl.formatMessage({ id: 'app.nav.import_label' })}</span>
        <Input
          id="home-import-link"
          value={import_link}
          onChange={(e) => set_import_link(e.target.value)}
          placeholder={intl.formatMessage({ id: 'app.nav.import_placeholder' })}
          disabled={busy}
        />
      </label>

      {message ? <p className="text-success mt-3 text-sm">{message}</p> : null}
      {error ? <p className="text-error mt-3 text-sm">{error}</p> : null}

      <div className="modal-action">
        <Button type="button" className="btn-outline" disabled={busy} onClick={on_close}>
          {intl.formatMessage({ id: 'app.nav.import_cancel' })}
        </Button>
        <Button
          type="button"
          className="btn-primary"
          disabled={busy || import_link.trim().length === 0}
          onClick={() => void handle_import()}
        >
          {busy
            ? intl.formatMessage({ id: 'app.nav.import_working' })
            : intl.formatMessage({ id: 'app.nav.import_confirm' })}
        </Button>
      </div>
    </Modal>
  )
}

export const ImportSnapshotDialog = connector(Wrapper)
