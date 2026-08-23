import { useEffect, useState, type FormEvent } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { normalizeBusinessHours, type BusinessHoursConfig } from '@/lib/business-hours'
import { resolve_repo_settings } from '@/lib/repo_settings'
import { parse_test_file_globs } from '@/lib/test_file_patterns'
import { RepoAnalysisFields } from './repo_analysis_fields'
import { connector, type ConnectorProps } from './repo_settings_dialog.connector'

function parse_ignored_bots(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function Wrapper({
  open,
  repo_full_name,
  on_close,
  repo_record,
  save_repo_settings,
}: ConnectorProps) {
  const intl = useIntl()
  const resolved = resolve_repo_settings(repo_record)
  const [ignored_bots, set_ignored_bots] = useState(resolved.ignored_bots.join('\n'))
  const [test_file_globs, set_test_file_globs] = useState(resolved.test_file_globs.join('\n'))
  const [business_hours, set_business_hours] = useState<BusinessHoursConfig>(
    resolved.business_hours,
  )
  const [message, set_message] = useState<string | null>(null)
  const [busy, set_busy] = useState(false)

  useEffect(() => {
    if (!open || !repo_full_name) return
    const next = resolve_repo_settings(repo_record)
    set_ignored_bots(next.ignored_bots.join('\n'))
    set_test_file_globs(next.test_file_globs.join('\n'))
    set_business_hours(next.business_hours)
    set_message(null)
    set_busy(false)
  }, [open, repo_full_name, repo_record])

  async function handle_save(event: FormEvent) {
    event.preventDefault()
    if (!repo_full_name) return
    set_busy(true)
    set_message(null)
    try {
      await save_repo_settings({
        repo_full_name,
        ignored_bots: parse_ignored_bots(ignored_bots),
        test_file_globs: parse_test_file_globs(test_file_globs),
        business_hours: normalizeBusinessHours(business_hours),
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
    <Modal
      open={open && repo_full_name !== null}
      on_close={on_close}
      box_className="max-h-[90vh] max-w-xl overflow-y-auto"
    >
      <h3 className="font-display text-xl font-semibold">
        {intl.formatMessage({ id: 'settings.title' })}
      </h3>
      <p className="text-base-content/60 mt-1 text-sm">
        {intl.formatMessage({ id: 'repo_settings.description' }, { repo: repo_full_name ?? '' })}
      </p>

      <form onSubmit={(event) => void handle_save(event)} className="mt-5 space-y-5">
        <RepoAnalysisFields
          ignored_bots={ignored_bots}
          on_ignored_bots_change={set_ignored_bots}
          test_file_globs={test_file_globs}
          on_test_file_globs_change={set_test_file_globs}
          business_hours={business_hours}
          on_business_hours_change={set_business_hours}
        />

        {message ? (
          <div role="alert" className="alert">
            <span>{message}</span>
          </div>
        ) : null}

        <div className="modal-action">
          <Button type="submit" className="btn-primary" disabled={busy || !repo_full_name}>
            {busy
              ? intl.formatMessage({ id: 'settings.saving' })
              : intl.formatMessage({ id: 'settings.save' })}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export const RepoSettingsDialog = connector(Wrapper)
