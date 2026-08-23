import { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { RepoPicker } from '@/components/repo_picker'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { connector, type ConnectorProps } from './add_repository_dialog.connector'

export function Wrapper({
  on_close,
  settings,
  available_repos,
  available_repos_loading,
  load_available_repos,
  save_settings,
  set_active_repo,
}: ConnectorProps & { on_close: () => void }) {
  const intl = useIntl()
  const [draft_repos, set_draft_repos] = useState(() => settings?.repos ?? [])
  const [saving, set_saving] = useState(false)
  const [error, set_error] = useState<string | null>(null)

  useEffect(() => {
    load_available_repos()
  }, [load_available_repos])

  if (!settings) return null

  const added_repos = draft_repos.filter((repo) => !settings.repos.includes(repo))
  const can_save = added_repos.length > 0 && !saving

  async function handle_save() {
    if (!settings || added_repos.length === 0) return
    set_saving(true)
    set_error(null)
    try {
      await save_settings({
        token: settings.token,
        repos: draft_repos,
        sync_interval_hours: settings.sync_interval_hours,
        backfill_limit: settings.backfill_limit,
        locale: settings.locale,
      })
      void set_active_repo(added_repos[0])
      on_close()
    } catch (err) {
      set_error(
        err instanceof Error
          ? err.message
          : intl.formatMessage({ id: 'app.nav.add_repository_failed' }),
      )
    } finally {
      set_saving(false)
    }
  }

  return (
    <Modal open on_close={on_close} box_className="max-w-lg">
      <h3 className="font-display text-lg font-semibold">
        {intl.formatMessage({ id: 'app.nav.add_repository_title' })}
      </h3>
      <p className="text-base-content/60 mt-1 text-sm">
        {intl.formatMessage({ id: 'app.nav.add_repository_description' })}
      </p>

      <div className="mt-4">
        <RepoPicker
          id="home-add-repo"
          availableRepos={available_repos}
          selected={draft_repos}
          onChange={set_draft_repos}
          token={settings.token}
          loading={available_repos_loading}
          disabled={!settings.token.trim() || saving}
        />
      </div>

      {error ? <p className="text-error mt-3 text-sm">{error}</p> : null}

      <div className="modal-action">
        <Button type="button" className="btn-outline" onClick={on_close}>
          {intl.formatMessage({ id: 'app.nav.add_repository_cancel' })}
        </Button>
        <Button
          type="button"
          className="btn-primary"
          disabled={!can_save}
          onClick={() => void handle_save()}
        >
          {saving
            ? intl.formatMessage({ id: 'app.nav.add_repository_saving' })
            : intl.formatMessage({ id: 'app.nav.add_repository_confirm' })}
        </Button>
      </div>
    </Modal>
  )
}

export const AddRepositoryDialog = connector(Wrapper)
