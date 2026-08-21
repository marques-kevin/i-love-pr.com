import { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { consume_share_link_from_location } from '@/lib/repo_snapshot'
import { connector, type ConnectorProps } from './repo_import_dialog.connector'

export function Wrapper({
  import_repository_requested,
  import_repo_snapshot_from_link,
  set_active_repo,
  refresh_metrics,
  run_sync,
  clear_import_repository_request,
}: ConnectorProps) {
  const intl = useIntl()
  const [open, set_open] = useState(false)
  const [import_link, set_import_link] = useState('')
  const [busy, set_busy] = useState(false)
  const [message, set_message] = useState<string | null>(null)

  useEffect(() => {
    const pending_link = consume_share_link_from_location()
    if (pending_link) {
      set_import_link(pending_link)
      set_open(true)
    }
  }, [])

  useEffect(() => {
    if (import_repository_requested) {
      set_import_link('')
      set_message(null)
      set_open(true)
    }
  }, [import_repository_requested])

  function close_dialog() {
    set_open(false)
    if (import_repository_requested) clear_import_repository_request()
  }

  async function handle_import() {
    const link = import_link.trim()
    if (!link) return
    set_busy(true)
    set_message(null)
    try {
      const result = await import_repo_snapshot_from_link(link)
      await set_active_repo(result.repo_full_name)
      set_import_link('')
      set_message(
        intl.formatMessage(
          { id: 'home.import_done' },
          { repo: result.repo_full_name, count: result.pr_count },
        ),
      )
      refresh_metrics()
      run_sync()
      close_dialog()
    } catch (err) {
      set_message(
        err instanceof Error ? err.message : intl.formatMessage({ id: 'home.import_failed' }),
      )
    } finally {
      set_busy(false)
    }
  }

  return (
    <Modal open={open} on_close={close_dialog} box_className="max-w-lg">
      <h3 className="font-display text-lg font-semibold">
        {intl.formatMessage({ id: 'home.import_title' })}
      </h3>
      <p className="text-base-content/60 mt-1 text-sm">
        {intl.formatMessage({ id: 'home.import_description' })}
      </p>

      <label className="form-control mt-4 w-full">
        <span className="label">{intl.formatMessage({ id: 'home.import_label' })}</span>
        <Input
          id="home-import-link"
          value={import_link}
          onChange={(event) => set_import_link(event.target.value)}
          placeholder={intl.formatMessage({ id: 'home.import_placeholder' })}
        />
      </label>

      {message ? <p className="text-error mt-3 text-sm">{message}</p> : null}

      <div className="modal-action">
        <Button type="button" className="btn-outline" onClick={close_dialog}>
          {intl.formatMessage({ id: 'home.import_cancel' })}
        </Button>
        <Button
          type="button"
          className="btn-primary"
          disabled={busy || import_link.trim().length === 0}
          onClick={() => void handle_import()}
        >
          {busy
            ? intl.formatMessage({ id: 'home.import_working' })
            : intl.formatMessage({ id: 'home.import_confirm' })}
        </Button>
      </div>
    </Modal>
  )
}

export const RepoImportDialog = connector(Wrapper)
