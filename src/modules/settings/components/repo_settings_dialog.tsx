import { useEffect, useState, type FormEvent } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  RepoSettingsForm,
  form_values_to_repo_settings_payload,
  repo_settings_to_form_values,
  type RepoSettingsFormValues,
} from './repo_settings_form'
import { connector, type ConnectorProps } from './repo_settings_dialog.connector'

type RepoSettingsDialogProps = ConnectorProps & {
  open: boolean
  repo_full_name: string | null
  on_close: () => void
}

export function Wrapper({
  open,
  repo_full_name,
  on_close,
  load_repo_settings,
  save_repo_settings,
}: RepoSettingsDialogProps) {
  const intl = useIntl()
  const [values, set_values] = useState<RepoSettingsFormValues | null>(null)
  const [message, set_message] = useState<string | null>(null)
  const [busy, set_busy] = useState(false)

  useEffect(() => {
    if (!open || !repo_full_name) {
      set_values(null)
      set_message(null)
      return
    }
    let cancelled = false
    void load_repo_settings(repo_full_name)
      .then((settings) => {
        if (!cancelled) set_values(repo_settings_to_form_values(settings))
      })
      .catch((err) => {
        if (!cancelled) {
          set_message(
            err instanceof Error ? err.message : intl.formatMessage({ id: 'settings.save_failed' }),
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [open, repo_full_name, load_repo_settings, intl])

  function handle_close() {
    if (busy) return
    set_values(null)
    set_message(null)
    on_close()
  }

  async function handle_save(event: FormEvent) {
    event.preventDefault()
    if (!repo_full_name || !values) return
    set_busy(true)
    set_message(null)
    try {
      await save_repo_settings({
        repo_full_name,
        ...form_values_to_repo_settings_payload(values),
      })
      handle_close()
    } catch (err) {
      set_message(
        err instanceof Error ? err.message : intl.formatMessage({ id: 'settings.save_failed' }),
      )
    } finally {
      set_busy(false)
    }
  }

  return (
    <Modal
      open={open && repo_full_name !== null}
      on_close={handle_close}
      box_className="max-h-[90vh] max-w-xl overflow-y-auto"
    >
      <h3 className="font-display text-xl font-semibold">
        {intl.formatMessage({ id: 'repo_settings.title' }, { repo: repo_full_name ?? '' })}
      </h3>
      <p className="text-base-content/60 mt-1 text-sm">
        {intl.formatMessage({ id: 'repo_settings.description' })}
      </p>

      {values ? (
        <form onSubmit={(e) => void handle_save(e)} className="mt-5 space-y-5">
          <RepoSettingsForm values={values} on_change={set_values} id_prefix="repo-settings" />

          {message ? (
            <div role="alert" className="alert">
              <span>{message}</span>
            </div>
          ) : null}

          <div className="modal-action">
            <Button type="button" className="btn-outline" disabled={busy} onClick={handle_close}>
              {intl.formatMessage({ id: 'repo_gallery.delete_cancel' })}
            </Button>
            <Button type="submit" className="btn-primary" disabled={busy}>
              {busy
                ? intl.formatMessage({ id: 'settings.saving' })
                : intl.formatMessage({ id: 'settings.save' })}
            </Button>
          </div>
        </form>
      ) : message ? (
        <div role="alert" className="alert mt-5">
          <span>{message}</span>
        </div>
      ) : (
        <p className="text-base-content/60 mt-5 text-sm">
          {intl.formatMessage({ id: 'settings.saving' })}
        </p>
      )}
    </Modal>
  )
}

export const RepoSettingsDialog = connector(Wrapper)
