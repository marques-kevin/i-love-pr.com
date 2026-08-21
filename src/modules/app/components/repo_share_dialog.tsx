import { useState } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'

type RepoShareDialogProps = {
  open: boolean
  repo_full_name: string
  on_close: () => void
  download_repo_snapshot_file: (input: { repo_full_name: string }) => Promise<void>
  create_repo_share_link: (input: { repo_full_name: string }) => {
    unwrap: () => Promise<{ share_url: string; pr_count: number }>
  }
}

export function RepoShareDialog({
  open,
  repo_full_name,
  on_close,
  download_repo_snapshot_file,
  create_repo_share_link,
}: RepoShareDialogProps) {
  const intl = useIntl()
  const [share_link, set_share_link] = useState<string | null>(null)
  const [share_busy, set_share_busy] = useState(false)
  const [message, set_message] = useState<string | null>(null)

  function handle_close() {
    set_share_link(null)
    set_message(null)
    on_close()
  }

  async function handle_download_snapshot() {
    set_share_busy(true)
    set_message(null)
    try {
      await download_repo_snapshot_file({ repo_full_name })
      set_message(intl.formatMessage({ id: 'settings.share.download_done' }))
    } catch (err) {
      set_message(
        err instanceof Error ? err.message : intl.formatMessage({ id: 'settings.share.failed' }),
      )
    } finally {
      set_share_busy(false)
    }
  }

  async function handle_create_share_link() {
    set_share_busy(true)
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
      set_share_busy(false)
    }
  }

  return (
    <Modal open={open} on_close={handle_close}>
      <h2 className="font-display text-lg font-semibold">
        {intl.formatMessage({ id: 'gallery.share_title' }, { repo: repo_full_name })}
      </h2>
      <p className="text-base-content/60 mt-2 text-sm">
        {intl.formatMessage({ id: 'settings.share.description' })}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          className="btn-outline"
          disabled={share_busy}
          onClick={() => void handle_download_snapshot()}
        >
          {intl.formatMessage({ id: 'settings.share.download' })}
        </Button>
        <Button
          type="button"
          className="btn-outline"
          disabled={share_busy}
          onClick={() => void handle_create_share_link()}
        >
          {share_busy
            ? intl.formatMessage({ id: 'settings.share.working' })
            : intl.formatMessage({ id: 'settings.share.create_link' })}
        </Button>
      </div>

      {share_link ? (
        <label className="form-control mt-4 w-full">
          <span className="label">{intl.formatMessage({ id: 'settings.share.link_label' })}</span>
          <Input readOnly value={share_link} className="font-mono text-xs" />
        </label>
      ) : null}

      {message ? (
        <div role="alert" className="alert mt-4">
          <span>{message}</span>
        </div>
      ) : null}
    </Modal>
  )
}
