import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { DashboardSquare01Icon } from '@/components/icons/dashboard_square_01'
import { Delete02Icon } from '@/components/icons/delete_02'
import { GithubIcon } from '@/components/icons/github'
import { Loading03Icon } from '@/components/icons/loading_03'
import { MoreHorizontalIcon } from '@/components/icons/more_horizontal'
import { Settings01Icon } from '@/components/icons/settings_01'
import { Share08Icon } from '@/components/icons/share_08'
import { close_daisy_dropdown } from '@/lib/daisy'
import { repo_dashboard_path, split_repo_full_name } from '@/lib/repo_path'
import { sync_cue_from_state, type SyncCue } from '@/lib/sync_cue'
import type { SyncState } from '@/lib/types'

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

export type RepoGalleryCardProps = {
  repo_full_name: string
  sync_states: SyncState[]
  show_imported_badge: boolean
  error_label: string
  syncing_label: string
  on_share: (repo_full_name: string) => void
  on_settings: (repo_full_name: string) => void
  on_delete: (repo_full_name: string) => void
}

export function RepoGalleryCard({
  repo_full_name,
  sync_states,
  show_imported_badge,
  error_label,
  syncing_label,
  on_share,
  on_settings,
  on_delete,
}: RepoGalleryCardProps) {
  const intl = useIntl()
  const { owner, name } = split_repo_full_name(repo_full_name)
  const cue = show_imported_badge
    ? 'idle'
    : sync_cue_from_state(sync_states.find((item) => item.repo_full_name === repo_full_name))

  return (
    <li className="relative">
      <Link
        to={repo_dashboard_path(repo_full_name)}
        aria-label={intl.formatMessage({ id: 'home.open_repo' }, { repo: repo_full_name })}
        className="block h-full no-underline"
      >
        <HoverIcon
          icon={GithubIcon}
          size={28}
          className="card bg-base-100 ring-base-content/10 flex h-full w-full flex-col items-start gap-4 rounded-3xl p-5 shadow-none ring-1 motion-safe:transition-[translate,box-shadow] motion-safe:hover:-translate-y-0.5 hover:shadow-sm"
        >
          <div className="min-w-0 w-full pr-10">
            <p className="font-display truncate text-lg font-semibold text-base-content">{name}</p>
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
          aria-label={intl.formatMessage(
            { id: 'repo_gallery.menu_label' },
            { repo: repo_full_name },
          )}
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
              to={repo_dashboard_path(repo_full_name)}
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
                on_settings(repo_full_name)
                close_daisy_dropdown(event.currentTarget)
              }}
            >
              <HoverIcon icon={Settings01Icon} size={16} />
              {intl.formatMessage({ id: 'repo_gallery.settings' })}
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={(event) => {
                on_share(repo_full_name)
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
                on_delete(repo_full_name)
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
}
