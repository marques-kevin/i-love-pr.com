import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { GithubIcon } from '@/components/icons/github'
import { Download01Icon } from '@/components/icons/download_01'
import { Loading03Icon } from '@/components/icons/loading_03'
import { PlusSignIcon } from '@/components/icons/plus_sign'
import { Button } from '@/components/ui/button'
import { repo_dashboard_path, split_repo_full_name } from '@/lib/repo_path'
import { sync_cue_from_state, type SyncCue } from '@/lib/sync_cue'
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

export function Wrapper({
  repos,
  sync_states,
  request_add_repository,
  open_import_dialog,
}: ConnectorProps) {
  const intl = useIntl()
  const error_label = intl.formatMessage({ id: 'app.nav.sync_error' })
  const syncing_label = intl.formatMessage({ id: 'sync.syncing' })

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

      {repos.length === 0 ? (
        <section className="card bg-base-100 ring-base-content/10 rounded-3xl shadow-none ring-1">
          <div className="card-body items-center gap-3 px-6 py-16 text-center">
            <h2 className="font-display text-lg font-semibold">
              {intl.formatMessage({ id: 'app.nav.repositories_empty' })}
            </h2>
            <p className="text-base-content/60 max-w-md text-sm">
              {intl.formatMessage({ id: 'home.empty_body' })}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Button type="button" className="btn-primary" onClick={request_add_repository}>
                <HoverIcon icon={PlusSignIcon} size={16} />
                {intl.formatMessage({ id: 'app.nav.add_repository' })}
              </Button>
              <Button type="button" className="btn-ghost" onClick={() => open_import_dialog()}>
                <HoverIcon icon={Download01Icon} size={16} />
                {intl.formatMessage({ id: 'app.nav.import' })}
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {repos.map((repo) => {
            const { owner, name } = split_repo_full_name(repo)
            const cue = sync_cue_from_state(
              sync_states.find((item) => item.repo_full_name === repo),
            )
            return (
              <li key={repo}>
                <Link
                  to={repo_dashboard_path(repo)}
                  aria-label={intl.formatMessage({ id: 'home.open_repo' }, { repo })}
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
                    </div>
                    {cue !== 'idle' ? (
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
      )}
    </div>
  )
}

export const RepoGallery = connector(Wrapper)
