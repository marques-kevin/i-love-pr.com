import { useState, type FormEvent } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { normalizeBusinessHours } from '@/lib/business-hours'
import { parse_ignored_bots } from '@/lib/repo_settings'
import { parse_test_file_globs } from '@/lib/test_file_patterns'
import type { RepoSettings } from '@/lib/types'
import { RepoSettingsForm, type RepoSettingsFormValue } from './repo_settings_form'
import { connector, type ConnectorProps } from './repo_settings_dialog.connector'

type RepoSettingsDialogProps = ConnectorProps & {
  open: boolean
  repo_full_name: string | null
  on_close: () => void
}

function form_value_from_settings(settings: RepoSettings): RepoSettingsFormValue {
  return {
    ignored_bots: settings.ignored_bots.join('\n'),
    test_file_globs: settings.test_file_globs.join('\n'),
    business_hours: normalizeBusinessHours(settings.business_hours),
  }
}

function Editor({
  repo_full_name,
  initial,
  on_close,
  save_repo_settings,
}: {
  repo_full_name: string
  initial: RepoSettings
  on_close: () => void
  save_repo_settings: RepoSettingsDialogProps['save_repo_settings']
}) {
  const intl = useIntl()
  const [draft, set_draft] = useState<RepoSettingsFormValue>(() =>
    form_value_from_settings(initial),
  )
  const [busy, set_busy] = useState(false)
  const [message, set_message] = useState<string | null>(null)

  async function handle_save(event: FormEvent) {
    event.preventDefault()
    set_busy(true)
    set_message(null)
    try {
      await save_repo_settings({
        repo_full_name,
        ignored_bots: parse_ignored_bots(draft.ignored_bots),
        test_file_globs: parse_test_file_globs(draft.test_file_globs),
        business_hours: normalizeBusinessHours(draft.business_hours),
      }).unwrap()
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
    <form onSubmit={(event) => void handle_save(event)} className="mt-5 space-y-5">
      <RepoSettingsForm value={draft} on_change={set_draft} />

      {message ? (
        <div role="alert" className="alert">
          <span>{message}</span>
        </div>
      ) : null}

      <div className="modal-action">
        <Button type="button" className="btn-outline" disabled={busy} onClick={on_close}>
          {intl.formatMessage({ id: 'repo_settings.cancel' })}
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
  repo_settings,
  save_repo_settings,
}: RepoSettingsDialogProps) {
  const intl = useIntl()

  return (
    <Modal
      open={open && repo_full_name !== null}
      on_close={on_close}
      box_className="max-h-[90vh] max-w-xl overflow-y-auto"
    >
      <h3 className="font-display text-xl font-semibold">
        {intl.formatMessage({ id: 'repo_settings.title' }, { repo: repo_full_name ?? '' })}
      </h3>
      <p className="text-base-content/60 mt-1 text-sm">
        {intl.formatMessage({ id: 'repo_settings.description' })}
      </p>
      {repo_full_name && repo_settings ? (
        <Editor
          key={repo_full_name}
          repo_full_name={repo_full_name}
          initial={repo_settings}
          on_close={on_close}
          save_repo_settings={save_repo_settings}
        />
      ) : null}
    </Modal>
  )
}

export const RepoSettingsDialog = connector(Wrapper)
