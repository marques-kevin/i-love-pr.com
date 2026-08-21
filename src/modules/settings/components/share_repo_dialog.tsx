import { useState } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { split_repo_full_name } from '@/lib/repo_path'
import { connector, type ConnectorProps } from './share_repo_dialog.connector'

type ShareRepoDialogProps = ConnectorProps & {
  open: boolean
  repo_full_name: string | null
  on_close: () => void
}

export function Wrapper({
  open,
  repo_full_name,
  on_close,
  download_repo_snapshot_file,
  create_repo_share_link,
}: ShareRepoDialogProps) {
  const intl = useIntl()
  const [share_link, set_share_link] = useState<string | null>(null)
  const [message, set_message] = useState<string | null>(null)
  const [busy, set_busy] = useState(false)

  const repo_name = repo_full_name ? split_repo_full_name(repo_full_name).name : ''

  function handle_close() {
    set_share_link(null)
    set_message(null)
    set_busy(false)
    on_close()
  }

  async function handle_download_snapshot() {
    if (!repo_full_name) return
    set_busy(true)
    set_message(null)
    try {
      await download_repo_snapshot_file({ repo_full_name })
      set_message(intl.formatMessage({ id: 'settings.share.download_done' }))
    } catch (err) {
      set_message(
        err instanceof Error ? err.message : intl.formatMessage({ id: 'settings.share.failed' }),
      )
    } finally {
      set_busy(false)
    }
  }

  async function handle_create_share_link() {
    if (!repo_full_name) return
    set_busy(true)
    set_message(null)
    try {
      const result = await create_repo_share_link({ repo_full_name }).unwrap()
      set_share_link(result.share_url)
      await navigator.clipboard.writeText(result.share_url)
      set_message(
        intl.formatMessage({ id: 'settings.share.link_ready' }, { count: result.pr_count }),
      )
    } catch (err) {
      set_message(
        err instanceof Error ? err.message : intl.formatMessage({ id: 'settings.share.failed' }),
      )
    } finally {
      set_busy(false)
    }
  }

  return (
    <Modal open={open && repo_full_name !== null} on_close={handle_close} box_className="max-w-lg">
      <h3 className="font-display text-xl font-semibold">{repo_name}</h3>
      <p className="text-base-content/60 mt-1 text-sm">
        {intl.formatMessage({ id: 'settings.share.description' })}
      </p>

      <div className="mt-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="btn-outline"
            disabled={busy || !repo_full_name}
            onClick={() => void handle_download_snapshot()}
          >
            {intl.formatMessage({ id: 'settings.share.download' })}
          </Button>
          <Button
            type="button"
            className="btn-outline"
            disabled={busy || !repo_full_name}
            onClick={() => void handle_create_share_link()}
          >
            {busy
              ? intl.formatMessage({ id: 'settings.share.working' })
              : intl.formatMessage({ id: 'settings.share.create_link' })}
          </Button>
        </div>

        {share_link ? (
          <label className="form-control w-full">
            <span className="label">{intl.formatMessage({ id: 'settings.share.link_label' })}</span>
            <Input readOnly value={share_link} className="font-mono text-xs" />
          </label>
        ) : null}

        {message ? (
          <div role="alert" className="alert">
            <span>{message}</span>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

export const ShareRepoDialog = connector(Wrapper)
