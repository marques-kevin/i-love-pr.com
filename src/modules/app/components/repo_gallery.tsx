import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { GithubIcon } from '@/components/icons/github'
import { Loading03Icon } from '@/components/icons/loading_03'
import { PlusSignIcon } from '@/components/icons/plus_sign'
import { Button } from '@/components/ui/button'
import { partition_gallery_repos } from '@/lib/repo_gallery'
import { repo_dashboard_path, split_repo_full_name } from '@/lib/repo_path'
import { sync_cue_from_state, type SyncCue } from '@/lib/sync_cue'
import type { SyncState } from '@/lib/types'
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
  show_sync_cue,
  show_imported_badge,
  open_repo_label,
  error_label,
  syncing_label,
  imported_badge_label,
}: {
  repos: string[]
  sync_states: SyncState[]
  show_sync_cue: boolean
  show_imported_badge: boolean
  open_repo_label: (repo: string) => string
  error_label: string
  syncing_label: string
  imported_badge_label: string
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {repos.map((repo) => {
        const { owner, name } = split_repo_full_name(repo)
        const cue = show_sync_cue
          ? sync_cue_from_state(sync_states.find((item) => item.repo_full_name === repo))
          : 'idle'
        return (
          <li key={repo}>
            <Link
              to={repo_dashboard_path(repo)}
              aria-label={open_repo_label(repo)}
              className="block h-full no-underline"
            >
              <HoverIcon
                icon={GithubIcon}
                size={28}
                className="card bg-base-100 ring-base-content/10 flex h-full w-full flex-col items-start gap-4 rounded-3xl p-5 shadow-none ring-1 motion-safe:transition-[translate,box-shadow] motion-safe:hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="min-w-0 w-full">
                  <p className="font-display truncate text-lg font-semibold text-base-content">
                    {name}
                  </p>
                  <p className="text-base-content/60 truncate text-sm">{owner}</p>
                  {show_imported_badge ? (
                    <span className="badge badge-ghost badge-sm mt-2">{imported_badge_label}</span>
                  ) : null}
                </div>
                {show_sync_cue && cue !== 'idle' ? (
                  <div className="text-base-content/60 mt-auto flex items-center gap-2 text-sm">
                    <RepoCue cue={cue} error_label={error_label} />
                    <span>{cue_label(cue, error_label, syncing_label)}</span>
                  </div>
                ) : null}
              </HoverIcon>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function EmptyOwnRepositories({
  request_add_repository,
  title,
  body,
  add_label,
}: {
  request_add_repository: () => void
  title: string
  body: string
  add_label: string
}) {
  return (
    <section className="card bg-base-100 ring-base-content/10 rounded-3xl shadow-none ring-1">
      <div className="card-body items-center gap-3 px-6 py-16 text-center">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <p className="text-base-content/60 max-w-md text-sm">{body}</p>
        <Button type="button" className="btn-primary mt-3" onClick={request_add_repository}>
          <HoverIcon icon={PlusSignIcon} size={16} />
          {add_label}
        </Button>
      </div>
    </section>
  )
}

export function Wrapper({
  repos,
  imported_repos,
  sync_states,
  request_add_repository,
}: ConnectorProps) {
  const intl = useIntl()
  const { own, imported } = partition_gallery_repos(repos, imported_repos)
  const error_label = intl.formatMessage({ id: 'app.nav.sync_error' })
  const syncing_label = intl.formatMessage({ id: 'sync.syncing' })
  const open_repo_label = (repo: string) => intl.formatMessage({ id: 'home.open_repo' }, { repo })
  const imported_badge_label = intl.formatMessage({ id: 'home.imported_badge' })

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
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">
            {intl.formatMessage({ id: 'home.my_repositories' })}
          </h2>
          {own.length === 0 ? (
            <EmptyOwnRepositories
              request_add_repository={request_add_repository}
              title={intl.formatMessage({ id: 'app.nav.repositories_empty' })}
              body={intl.formatMessage({ id: 'home.empty_body' })}
              add_label={intl.formatMessage({ id: 'app.nav.add_repository' })}
            />
          ) : (
            <RepoGrid
              repos={own}
              sync_states={sync_states}
              show_sync_cue={true}
              show_imported_badge={false}
              open_repo_label={open_repo_label}
              error_label={error_label}
              syncing_label={syncing_label}
              imported_badge_label={imported_badge_label}
            />
          )}
        </section>

        {imported.length > 0 ? (
          <section className="space-y-4">
            <h2 className="font-display text-lg font-semibold">
              {intl.formatMessage({ id: 'home.imported_repositories' })}
            </h2>
            <RepoGrid
              repos={imported}
              sync_states={sync_states}
              show_sync_cue={false}
              show_imported_badge={true}
              open_repo_label={open_repo_label}
              error_label={error_label}
              syncing_label={syncing_label}
              imported_badge_label={imported_badge_label}
            />
          </section>
        ) : null}
      </div>
    </div>
  )
}

export const RepoGallery = connector(Wrapper)
