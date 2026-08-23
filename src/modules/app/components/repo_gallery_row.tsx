import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { DashboardSquare01Icon } from '@/components/icons/dashboard_square_01'
import { Delete02Icon } from '@/components/icons/delete_02'
import { Loading03Icon } from '@/components/icons/loading_03'
import { MoreHorizontalIcon } from '@/components/icons/more_horizontal'
import { Settings01Icon } from '@/components/icons/settings_01'
import { Share08Icon } from '@/components/icons/share_08'
import {
  format_gallery_count,
  format_gallery_hours,
  type GalleryRowStats,
} from '@/lib/gallery_row_stats'
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

function Sparkline({ values }: { values: number[] }) {
  const width = 56
  const height = 18
  const max = Math.max(...values, 1)
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
      const y = height - (value / max) * (height - 2) - 1
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="text-primary/70 shrink-0"
      aria-hidden={true}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

function MetricDivider() {
  return (
    <div className="bg-base-content/10 hidden h-10 w-px shrink-0 sm:block" aria-hidden={true} />
  )
}

export type RepoGalleryRowProps = {
  repo_full_name: string
  stats: GalleryRowStats | undefined
  sync_states: SyncState[]
  show_imported_badge: boolean
  error_label: string
  syncing_label: string
  on_share: (repo_full_name: string) => void
  on_settings: (repo_full_name: string) => void
  on_delete: (repo_full_name: string) => void
}

export function RepoGalleryRow({
  repo_full_name,
  stats,
  sync_states,
  show_imported_badge,
  error_label,
  syncing_label,
  on_share,
  on_settings,
  on_delete,
}: RepoGalleryRowProps) {
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
        className="bg-base-100 ring-base-content/10 hover:bg-base-100/80 block rounded-2xl p-4 pr-12 shadow-none ring-1 no-underline motion-safe:transition-colors sm:rounded-3xl sm:p-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-lg font-semibold text-base-content">{name}</p>
            <p className="text-base-content/60 truncate text-sm">{owner}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {show_imported_badge ? (
                <span className="badge badge-ghost badge-sm">
                  {intl.formatMessage({ id: 'home.imported_badge' })}
                </span>
              ) : null}
              {!show_imported_badge && cue !== 'idle' ? (
                <div className="text-base-content/60 flex items-center gap-2 text-sm">
                  <RepoCue cue={cue} error_label={error_label} />
                  <span>{cue_label(cue, error_label, syncing_label)}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 items-stretch gap-4 overflow-x-auto pb-1 sm:gap-6 sm:pb-0">
            <div className="min-w-[8.5rem] shrink-0">
              <p className="text-base-content/50 text-xs font-medium tracking-wide uppercase">
                {intl.formatMessage({ id: 'repo_gallery.throughput' })}
              </p>
              <div className="mt-1 flex items-end gap-2">
                {stats?.sparkline ? <Sparkline values={stats.sparkline} /> : null}
                <div>
                  <p className="font-display text-2xl leading-none font-semibold tabular-nums">
                    {format_gallery_count(stats?.merged_count_30d ?? null)}
                  </p>
                  <p className="text-base-content/50 mt-1 text-xs tabular-nums">
                    {intl.formatMessage(
                      { id: 'repo_gallery.open_prs' },
                      { count: format_gallery_count(stats?.open_count ?? null) },
                    )}
                  </p>
                </div>
              </div>
            </div>

            <MetricDivider />

            <div className="min-w-[5.5rem] shrink-0">
              <p className="text-base-content/50 text-xs font-medium tracking-wide uppercase">
                {intl.formatMessage({ id: 'repo_gallery.cycle' })}
              </p>
              <p className="font-display mt-1 text-2xl leading-none font-semibold tabular-nums">
                {format_gallery_hours(stats?.avg_cycle_hours ?? null)}
              </p>
            </div>

            <MetricDivider />

            <div className="min-w-[5.5rem] shrink-0">
              <p className="text-base-content/50 text-xs font-medium tracking-wide uppercase">
                {intl.formatMessage({ id: 'repo_gallery.first_review' })}
              </p>
              <p className="font-display mt-1 text-2xl leading-none font-semibold tabular-nums">
                {format_gallery_hours(stats?.avg_first_review_hours ?? null)}
              </p>
            </div>
          </div>
        </div>
      </Link>

      <div className="dropdown dropdown-end absolute top-3 right-3 sm:top-4 sm:right-4">
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
                on_share(repo_full_name)
                close_daisy_dropdown(event.currentTarget)
              }}
            >
              <HoverIcon icon={Share08Icon} size={16} />
              {intl.formatMessage({ id: 'repo_gallery.share' })}
            </button>
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
