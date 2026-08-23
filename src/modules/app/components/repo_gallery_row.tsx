import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { DashboardSquare01Icon } from '@/components/icons/dashboard_square_01'
import { Delete02Icon } from '@/components/icons/delete_02'
import { Loading03Icon } from '@/components/icons/loading_03'
import { MoreHorizontalIcon } from '@/components/icons/more_horizontal'
import { Settings01Icon } from '@/components/icons/settings_01'
import { Share08Icon } from '@/components/icons/share_08'
import { close_daisy_dropdown } from '@/lib/daisy'
import { EMPTY_STAT, format_count, format_hours } from '@/lib/format_hours'
import { EMPTY_GALLERY_ROW_STATS, type GalleryRowStats } from '@/lib/gallery_row_stats'
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
  const width = 72
  const height = 28
  const pad = 2
  const max = Math.max(...values, 1)
  const last_index = Math.max(values.length - 1, 1)
  const points = values
    .map((value, index) => {
      const x = pad + (index / last_index) * (width - pad * 2)
      const y = height - pad - (value / max) * (height - pad * 2)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="text-primary shrink-0"
      aria-hidden={true}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  )
}

function MetricColumn({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-[8.5rem] flex-col justify-center px-4">
      <p className="text-base-content/50 text-[10px] font-medium tracking-wide uppercase">
        {label}
      </p>
      {children}
    </div>
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
  const row_stats = stats ?? EMPTY_GALLERY_ROW_STATS
  const cue = show_imported_badge
    ? 'idle'
    : sync_cue_from_state(sync_states.find((item) => item.repo_full_name === repo_full_name))

  return (
    <li className="relative">
      <Link
        to={repo_dashboard_path(repo_full_name)}
        aria-label={intl.formatMessage({ id: 'home.open_repo' }, { repo: repo_full_name })}
        className="bg-base-100 ring-base-content/10 hover:bg-base-200/40 flex items-center gap-3 rounded-2xl py-3 pr-12 pl-4 no-underline shadow-none ring-1 motion-safe:transition-colors"
      >
        <div className="min-w-36 w-36 shrink-0 sm:min-w-48 sm:w-48">
          <p className="font-display truncate text-base font-semibold text-base-content">{name}</p>
          <p className="text-base-content/60 truncate text-sm">{owner}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {show_imported_badge ? (
              <span className="badge badge-ghost badge-sm">
                {intl.formatMessage({ id: 'home.imported_badge' })}
              </span>
            ) : null}
            {!show_imported_badge && cue !== 'idle' ? (
              <span className="text-base-content/60 inline-flex items-center gap-1.5 text-xs">
                <RepoCue cue={cue} error_label={error_label} />
                <span>{cue_label(cue, error_label, syncing_label)}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="divide-base-content/10 flex min-w-max divide-x">
            <MetricColumn label={intl.formatMessage({ id: 'repo_gallery.throughput' })}>
              <div className="mt-1 flex items-center gap-3">
                {row_stats.weekly_merged ? <Sparkline values={row_stats.weekly_merged} /> : null}
                <div>
                  <p className="font-display text-xl leading-none font-semibold tabular-nums">
                    {format_count(row_stats.merged_count)}
                  </p>
                  <p className="text-base-content/50 mt-1 text-xs tabular-nums">
                    {row_stats.open_count == null
                      ? EMPTY_STAT
                      : intl.formatMessage(
                          { id: 'repo_gallery.open_prs' },
                          { count: row_stats.open_count },
                        )}
                  </p>
                </div>
              </div>
            </MetricColumn>
            <MetricColumn label={intl.formatMessage({ id: 'repo_gallery.cycle' })}>
              <p className="font-display mt-1 text-xl leading-none font-semibold tabular-nums">
                {format_hours(row_stats.avg_cycle_hours)}
              </p>
            </MetricColumn>
            <MetricColumn label={intl.formatMessage({ id: 'repo_gallery.review' })}>
              <p className="font-display mt-1 text-xl leading-none font-semibold tabular-nums">
                {format_hours(row_stats.avg_first_review_hours)}
              </p>
            </MetricColumn>
          </div>
        </div>
      </Link>

      <div className="dropdown dropdown-end absolute top-2 right-2">
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
