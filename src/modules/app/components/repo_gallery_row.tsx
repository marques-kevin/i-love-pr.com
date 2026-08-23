import type { ReactNode } from 'react'
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
import { format_hours } from '@/lib/format_hours'
import type { GalleryRowStats } from '@/lib/gallery_row_stats'
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

function format_count(value: number | null): string {
  if (value == null) return '—'
  return String(value)
}

function Sparkline({ values }: { values: number[] }) {
  const width = 72
  const height = 28
  const max = Math.max(...values, 1)
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
      const y = height - (value / max) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="text-primary h-7 w-[4.5rem] shrink-0"
      aria-hidden={true}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

function MetricColumn({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-[7.5rem] shrink-0 px-4 first:pl-0 last:pr-0">
      <p className="text-base-content/50 mb-1 text-[0.65rem] font-medium tracking-[0.08em] uppercase">
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
  const cue = show_imported_badge
    ? 'idle'
    : sync_cue_from_state(sync_states.find((item) => item.repo_full_name === repo_full_name))

  return (
    <li className="relative">
      <Link
        to={repo_dashboard_path(repo_full_name)}
        aria-label={intl.formatMessage({ id: 'home.open_repo' }, { repo: repo_full_name })}
        className="bg-base-100 ring-base-content/10 hover:bg-base-200/40 block rounded-2xl ring-1 no-underline motion-safe:transition-colors"
      >
        <div className="flex min-w-0 items-stretch gap-4 p-4 pr-12 sm:gap-6 sm:p-5 sm:pr-14">
          <div className="min-w-0 shrink-0 sm:max-w-[14rem]">
            <div className="flex items-start gap-3">
              <HoverIcon
                icon={GithubIcon}
                size={24}
                className="text-base-content/70 mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <p className="font-display truncate text-base font-semibold text-base-content sm:text-lg">
                  {name}
                </p>
                <p className="text-base-content/60 truncate text-sm">{owner}</p>
                {show_imported_badge ? (
                  <span className="badge badge-ghost badge-sm mt-2">
                    {intl.formatMessage({ id: 'home.imported_badge' })}
                  </span>
                ) : null}
                {!show_imported_badge && cue !== 'idle' ? (
                  <div className="text-base-content/60 mt-2 flex items-center gap-2 text-xs sm:text-sm">
                    <RepoCue cue={cue} error_label={error_label} />
                    <span>{cue_label(cue, error_label, syncing_label)}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-base-content/10 min-w-0 flex-1 overflow-x-auto">
            <div className="flex min-w-max items-stretch divide-x divide-base-content/10">
              <MetricColumn label={intl.formatMessage({ id: 'widget.throughput.label' })}>
                <div className="flex items-end gap-3">
                  {stats?.weekly_merged_counts ? (
                    <Sparkline values={stats.weekly_merged_counts} />
                  ) : null}
                  <div>
                    <p className="font-display text-2xl leading-none font-semibold tabular-nums">
                      {format_count(stats?.merged_count_30d ?? null)}
                    </p>
                    <p className="text-base-content/60 mt-1 text-xs">
                      {intl.formatMessage({ id: 'widget.open_prs.label' })}:{' '}
                      <span className="tabular-nums">
                        {format_count(stats?.open_count ?? null)}
                      </span>
                    </p>
                  </div>
                </div>
              </MetricColumn>

              <MetricColumn label={intl.formatMessage({ id: 'stats.cycle_time' })}>
                <p className="font-display text-2xl leading-none font-semibold tabular-nums">
                  {format_hours(stats?.avg_cycle_hours ?? null)}
                </p>
              </MetricColumn>

              <MetricColumn label={intl.formatMessage({ id: 'stats.tfr' })}>
                <p className="font-display text-2xl leading-none font-semibold tabular-nums">
                  {format_hours(stats?.avg_time_to_first_review_hours ?? null)}
                </p>
              </MetricColumn>
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
