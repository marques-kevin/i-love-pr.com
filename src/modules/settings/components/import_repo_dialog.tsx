import { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { connector, type ConnectorProps } from './import_repo_dialog.connector'

export function Wrapper({
  on_close,
  import_repo_link,
  has_github_token,
  import_repo_snapshot_from_link,
  set_active_repo,
  refresh_metrics,
  run_sync,
}: ConnectorProps & { on_close: () => void }) {
  const intl = useIntl()
  const [share_link, set_share_link] = useState(import_repo_link ?? '')
  const [importing, set_importing] = useState(false)
  const [error, set_error] = useState<string | null>(null)

  useEffect(() => {
    if (import_repo_link) {
      set_share_link(import_repo_link)
    }
  }, [import_repo_link])

  async function handle_import() {
    const link = share_link.trim()
    if (!link) return
    set_importing(true)
    set_error(null)
    try {
      const result = await import_repo_snapshot_from_link({ share_link: link })
      set_active_repo(result.repo_full_name)
      set_share_link('')
      refresh_metrics()
      if (has_github_token) {
        run_sync()
      }
      on_close()
    } catch (err) {
      set_error(
        err instanceof Error
          ? err.message
          : intl.formatMessage({ id: 'app.nav.import_repository_failed' }),
      )
    } finally {
      set_importing(false)
    }
  }

  return (
    <Modal open on_close={on_close} box_className="max-w-lg">
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

      {error ? <p className="text-error mt-3 text-sm">{error}</p> : null}

      <div className="modal-action">
        <Button type="button" className="btn-outline" disabled={importing} onClick={on_close}>
          {intl.formatMessage({ id: 'app.nav.import_repository_cancel' })}
        </Button>
        <Button
          type="button"
          className="btn-primary"
          disabled={importing || share_link.trim().length === 0}
          onClick={() => void handle_import()}
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
