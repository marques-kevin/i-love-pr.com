import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { DashboardSquare01Icon } from '@/components/icons/dashboard_square_01'
import { Delete02Icon } from '@/components/icons/delete_02'
import { GithubIcon } from '@/components/icons/github'
import { Loading03Icon } from '@/components/icons/loading_03'
import { MoreHorizontalIcon } from '@/components/icons/more_horizontal'
import { PlusSignIcon } from '@/components/icons/plus_sign'
import { Share08Icon } from '@/components/icons/share_08'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { close_daisy_dropdown } from '@/lib/daisy'
import { repo_dashboard_path, split_repo_full_name } from '@/lib/repo_path'
import { sync_cue_from_state, type SyncCue } from '@/lib/sync_cue'
import type { SyncState } from '@/lib/types'
import { ShareRepoDialog } from '@/modules/settings/components/share_repo_dialog'
import { connector, type ConnectorProps } from './repo_gallery.connector'

function RepoCue({ cue, error_label }: { cue: SyncCue; error_label: string }) {
  if (cue === 'syncing') {
    return (
      <Loading03Icon size={14} className="text-base-content/60 animate-spin" aria-hidden={true} />
    )
  }
  if (cue === 'error') {
    return <span className="bg-error size-2 rounded-full" aria-label={error_label} />
  }
  return null
}

function cue_label(cue: SyncCue, error_label: string, syncing_label: string) {
  if (cue === 'error') return error_label
  return syncing_label
}

function RepoGrid({
  repos,
  sync_states,
  show_imported_badge,
  error_label,
  syncing_label,
  on_share,
  on_delete,
}: {
  repos: string[]
  sync_states: SyncState[]
  show_imported_badge: boolean
  error_label: string
  syncing_label: string
  on_share: (repo: string) => void
  on_delete: (repo: string) => void
}) {
  const intl = useIntl()

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {repos.map((repo) => {
        const { owner, name } = split_repo_full_name(repo)
        const cue = show_imported_badge
          ? 'idle'
          : sync_cue_from_state(sync_states.find((item) => item.repo_full_name === repo))
        const dashboard_path = repo_dashboard_path(repo)
        return (
          <li key={repo} className="relative">
            <Link
              to={dashboard_path}
              aria-label={intl.formatMessage({ id: 'home.open_repo' }, { repo })}
              className="block h-full no-underline"
            >
              <HoverIcon
                icon={GithubIcon}
                size={28}
                className="card bg-base-100 ring-base-content/10 flex h-full w-full flex-col items-start gap-4 rounded-3xl p-5 shadow-none ring-1 motion-safe:transition-[translate,box-shadow] motion-safe:hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="min-w-0 w-full pr-8">
                  <p className="font-display truncate text-lg font-semibold text-base-content">
                    {name}
                  </p>
                  <p className="text-base-content/60 truncate text-sm">{owner}</p>
                  {show_imported_badge ? (
                    <span className="badge badge-ghost badge-sm mt-2">
                      {intl.formatMessage({ id: 'home.imported_badge' })}
                    </span>
                  ) : null}
                </div>
                {!show_imported_badge && cue !== 'idle' ? (
                  <div className="text-base-content/60 mt-auto flex items-center gap-2 text-sm">
                    <RepoCue cue={cue} error_label={error_label} />
                    <span>{cue_label(cue, error_label, syncing_label)}</span>
                  </div>
                ) : null}
              </HoverIcon>
            </Link>

            <div className="dropdown dropdown-end absolute top-3 right-3">
              <button
                type="button"
                tabIndex={0}
                className="btn btn-ghost btn-circle btn-sm"
                aria-label={intl.formatMessage({ id: 'repo_gallery.menu_label' }, { repo })}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
              >
                <HoverIcon icon={MoreHorizontalIcon} size={16} />
              </button>
              <ul
                tabIndex={-1}
                className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow"
              >
                <li>
                  <Link
                    to={dashboard_path}
                    onClick={(event) => close_daisy_dropdown(event.currentTarget)}
                  >
                    <HoverIcon icon={DashboardSquare01Icon} size={16} />
                    {intl.formatMessage({ id: 'repo_gallery.view' })}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={(event) => {
                      on_share(repo)
                      close_daisy_dropdown(event.currentTarget)
                    }}
                  >
                    <HoverIcon icon={Share08Icon} size={16} />
                    {intl.formatMessage({ id: 'repo_gallery.share' })}
                  </button>
                </li>
                <li>
                  <hr className="border-base-300 my-1" />
                </li>
                <li>
                  <button
                    type="button"
                    className="text-error"
                    onClick={(event) => {
                      on_delete(repo)
                      close_daisy_dropdown(event.currentTarget)
                    }}
                  >
                    <HoverIcon icon={Delete02Icon} size={16} />
                    {intl.formatMessage({ id: 'repo_gallery.delete' })}
                  </button>
                </li>
              </ul>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function Wrapper({
  own_repositories,
  imported_repositories,
  sync_states,
  request_add_repository,
  request_import_repository,
  remove_repo,
}: ConnectorProps) {
  const intl = useIntl()
  const error_label = intl.formatMessage({ id: 'app.nav.sync_error' })
  const syncing_label = intl.formatMessage({ id: 'sync.syncing' })
  const [share_repo, set_share_repo] = useState<string | null>(null)
  const [delete_repo, set_delete_repo] = useState<string | null>(null)
  const [delete_busy, set_delete_busy] = useState(false)

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
              <RepoGrid
                repos={own_repositories}
                sync_states={sync_states}
                show_imported_badge={false}
                error_label={error_label}
                syncing_label={syncing_label}
                on_share={set_share_repo}
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
              <RepoGrid
                repos={imported_repositories}
                sync_states={sync_states}
                show_imported_badge={true}
                error_label={error_label}
                syncing_label={syncing_label}
                on_share={set_share_repo}
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
