import { useState, type FormEvent } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { RepoSettings } from '@/lib/types'
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

function RepoSettingsFormBody({
  repo_full_name,
  repo_settings,
  save_repo_settings,
  on_close,
}: {
  repo_full_name: string
  repo_settings: RepoSettings
  save_repo_settings: ConnectorProps['save_repo_settings']
  on_close: () => void
}) {
  const intl = useIntl()
  const [values, set_values] = useState<RepoSettingsFormValues>(() =>
    repo_settings_to_form_values(repo_settings),
  )
  const [message, set_message] = useState<string | null>(null)
  const [busy, set_busy] = useState(false)

  async function handle_save(event: FormEvent) {
    event.preventDefault()
    set_busy(true)
    set_message(null)
    try {
      await save_repo_settings({
        repo_full_name,
        ...form_values_to_repo_settings_payload(values),
      })
      on_close()
    } catch (err) {
      set_message(
        err instanceof Error ? err.message : intl.formatMessage({ id: 'settings.save_failed' }),
      )
    } finally {
      set_busy(false)
    }
  }

  return (
    <form onSubmit={(e) => void handle_save(e)} className="mt-5 space-y-5">
      <RepoSettingsForm values={values} on_change={set_values} id_prefix="repo-settings" />

      {message ? (
        <div role="alert" className="alert">
          <span>{message}</span>
        </div>
      ) : null}

      <div className="modal-action">
        <Button type="button" className="btn-outline" disabled={busy} onClick={on_close}>
          {intl.formatMessage({ id: 'repo_gallery.delete_cancel' })}
        </Button>
        <Button type="submit" className="btn-primary" disabled={busy}>
          {busy
            ? intl.formatMessage({ id: 'settings.saving' })
            : intl.formatMessage({ id: 'settings.save' })}
        </Button>
      </div>
    </form>
  )
}

export function Wrapper({
  open,
  repo_full_name,
  on_close,
  current_repo_settings,
  current_repo_settings_repo,
  current_repo_settings_loading,
  current_repo_settings_error,
  save_repo_settings,
}: RepoSettingsDialogProps) {
  const intl = useIntl()
  const repo_settings =
    current_repo_settings && current_repo_settings.repo_full_name === repo_full_name
      ? current_repo_settings
      : null
  const loading = current_repo_settings_loading && current_repo_settings_repo === repo_full_name
  const load_error =
    current_repo_settings_repo === repo_full_name ? current_repo_settings_error : null

  function handle_close() {
    on_close()
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

      {repo_settings && repo_full_name ? (
        <RepoSettingsFormBody
          key={repo_full_name}
          repo_full_name={repo_full_name}
          repo_settings={repo_settings}
          save_repo_settings={save_repo_settings}
          on_close={handle_close}
        />
      ) : load_error ? (
        <div role="alert" className="alert mt-5">
          <span>{load_error}</span>
        </div>
      ) : loading ? (
        <p className="text-base-content/60 mt-5 text-sm">
          {intl.formatMessage({ id: 'settings.saving' })}
        </p>
      ) : null}
    </Modal>
  )
}

export const RepoSettingsDialog = connector(Wrapper)
