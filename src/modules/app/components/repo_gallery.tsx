import { useState } from 'react'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { PlusSignIcon } from '@/components/icons/plus_sign'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { SyncState } from '@/lib/types'
import type { GalleryRowStats } from '@/lib/gallery_row_stats'
import { ShareRepoDialog } from '@/modules/settings/components/share_repo_dialog'
import { RepoSettingsDialog } from '@/modules/settings/components/repo_settings_dialog'
import { ImportProgressBanner } from './import_progress_banner'
import { RepoGalleryRow } from './repo_gallery_row'
import { connector, type ConnectorProps } from './repo_gallery.connector'

function RepoRowList({
  repos,
  stats_by_repo,
  sync_states,
  show_imported_badge,
  error_label,
  syncing_label,
  on_share,
  on_settings,
  on_delete,
}: {
  repos: string[]
  stats_by_repo: Record<string, GalleryRowStats>
  sync_states: SyncState[]
  show_imported_badge: boolean
  error_label: string
  syncing_label: string
  on_share: (repo: string) => void
  on_settings: (repo: string) => void
  on_delete: (repo: string) => void
}) {
  return (
    <ul className="space-y-3">
      {repos.map((repo) => (
        <RepoGalleryRow
          key={repo}
          repo_full_name={repo}
          stats={stats_by_repo[repo]}
          sync_states={sync_states}
          show_imported_badge={show_imported_badge}
          error_label={error_label}
          syncing_label={syncing_label}
          on_share={on_share}
          on_settings={on_settings}
          on_delete={on_delete}
        />
      ))}
    </ul>
  )
}

export function Wrapper({
  own_repositories,
  imported_repositories,
  sync_states,
  stats_by_repo,
  request_add_repository,
  request_import_repository,
  remove_repo,
  load_repo_settings,
}: ConnectorProps) {
  const intl = useIntl()
  const error_label = intl.formatMessage({ id: 'app.nav.sync_error' })
  const syncing_label = intl.formatMessage({ id: 'sync.syncing' })
  const [share_repo, set_share_repo] = useState<string | null>(null)
  const [settings_repo, set_settings_repo] = useState<string | null>(null)
  const [delete_repo, set_delete_repo] = useState<string | null>(null)
  const [delete_busy, set_delete_busy] = useState(false)

  function handle_open_settings(repo_full_name: string) {
    load_repo_settings(repo_full_name)
    set_settings_repo(repo_full_name)
  }

  async function handle_confirm_delete() {
    if (!delete_repo) return
    set_delete_busy(true)
    try {
      await remove_repo(delete_repo).unwrap()
      set_delete_repo(null)
    } finally {
      set_delete_busy(false)
    }
  }

  return (
    <div className="space-y-6">
      <ImportProgressBanner />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {intl.formatMessage({ id: 'app.nav.repositories' })}
        </h1>
        <p className="text-base-content/60 mt-1 text-sm">
          {intl.formatMessage({ id: 'app.nav.select_repository' })}
        </p>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="font-display text-lg">
            {intl.formatMessage({ id: 'home.my_repositories' })}
          </h2>
          {own_repositories.length === 0 ? (
            <div className="card bg-base-100 ring-base-content/10 mt-4 rounded-3xl shadow-none ring-1">
              <div className="card-body items-center gap-3 px-6 py-16 text-center">
                <h3 className="font-display text-lg font-semibold">
                  {intl.formatMessage({ id: 'app.nav.repositories_empty' })}
                </h3>
                <p className="text-base-content/60 max-w-md text-sm">
                  {intl.formatMessage({ id: 'home.empty_body' })}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <Button type="button" className="btn-primary" onClick={request_add_repository}>
                    <HoverIcon icon={PlusSignIcon} size={16} />
                    {intl.formatMessage({ id: 'app.nav.add_repository' })}
                  </Button>
                  <Button
                    type="button"
                    className="btn-ghost"
                    onClick={() => request_import_repository()}
                  >
                    {intl.formatMessage({ id: 'app.nav.import_repository' })}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <RepoRowList
                repos={own_repositories}
                stats_by_repo={stats_by_repo}
                sync_states={sync_states}
                show_imported_badge={false}
                error_label={error_label}
                syncing_label={syncing_label}
                on_share={set_share_repo}
                on_settings={handle_open_settings}
                on_delete={set_delete_repo}
              />
            </div>
          )}
        </section>

        {imported_repositories.length > 0 ? (
          <section>
            <h2 className="font-display text-lg">
              {intl.formatMessage({ id: 'home.imported_repositories' })}
            </h2>
            <div className="mt-4">
              <RepoRowList
                repos={imported_repositories}
                stats_by_repo={stats_by_repo}
                sync_states={sync_states}
                show_imported_badge={true}
                error_label={error_label}
                syncing_label={syncing_label}
                on_share={set_share_repo}
                on_settings={handle_open_settings}
                on_delete={set_delete_repo}
              />
            </div>
          </section>
        ) : null}
      </div>

      <ShareRepoDialog
        open={share_repo !== null}
        repo_full_name={share_repo}
        on_close={() => set_share_repo(null)}
      />

      <RepoSettingsDialog
        open={settings_repo !== null}
        repo_full_name={settings_repo}
        on_close={() => set_settings_repo(null)}
      />

      <Modal
        open={delete_repo !== null}
        on_close={() => {
          if (!delete_busy) set_delete_repo(null)
        }}
        box_className="max-w-md"
      >
        <h3 className="font-display text-lg font-semibold">
          {intl.formatMessage({ id: 'repo_gallery.delete' })}
        </h3>
        <p className="text-base-content/60 mt-1 text-sm">
          {intl.formatMessage({ id: 'repo_gallery.delete_confirm' }, { repo: delete_repo ?? '' })}
        </p>
        <div className="modal-action">
          <Button
            type="button"
            className="btn-outline"
            disabled={delete_busy}
            onClick={() => set_delete_repo(null)}
          >
            {intl.formatMessage({ id: 'repo_gallery.delete_cancel' })}
          </Button>
          <Button
            type="button"
            className="btn-error"
            disabled={delete_busy}
            onClick={() => void handle_confirm_delete()}
          >
            {intl.formatMessage({ id: 'repo_gallery.delete' })}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export const RepoGallery = connector(Wrapper)
