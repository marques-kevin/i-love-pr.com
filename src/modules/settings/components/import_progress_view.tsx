import { useIntl } from 'react-intl'
import type { ImportJobState, ImportProgress } from '@/lib/types'
import type { MessageKey } from '@/lib/i18n/messages/en'
import { import_progress_percent } from '@/lib/import_progress'

const STAGE_MESSAGE_KEYS = {
  downloading: 'app.nav.import_repository_stage_downloading',
  writing_prs: 'app.nav.import_repository_stage_writing_prs',
  writing_reviews: 'app.nav.import_repository_stage_writing_reviews',
  writing_files: 'app.nav.import_repository_stage_writing_files',
  saving_settings: 'app.nav.import_repository_stage_saving_settings',
  building_facts: 'app.nav.import_repository_stage_building_facts',
} as const satisfies Record<ImportProgress['stage'], MessageKey>

export type ImportProgressViewProps = {
  import_job: ImportJobState
  className?: string
}

export function ImportProgressView({ import_job, className }: ImportProgressViewProps) {
  const intl = useIntl()
  const progress = import_job.progress
  const percent = progress ? import_progress_percent(progress) : null
  const stage_label = progress
    ? intl.formatMessage({ id: STAGE_MESSAGE_KEYS[progress.stage] })
    : null
  const detail =
    progress?.total != null && progress.total > 0
      ? intl.formatMessage(
          { id: 'app.nav.import_repository_progress_count' },
          { completed: progress.completed, total: progress.total },
        )
      : null
  const repo_label = import_job.repo_full_name ?? progress?.repo_full_name

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {repo_label
            ? intl.formatMessage(
                { id: 'app.nav.import_repository_progress_repo' },
                { repo: repo_label },
              )
            : intl.formatMessage({ id: 'app.nav.import_repository_importing' })}
        </p>
        {percent != null ? (
          <span className="text-base-content/60 text-xs tabular-nums">{percent}%</span>
        ) : null}
      </div>
      <progress
        className="progress progress-primary mt-2 w-full"
        value={percent ?? undefined}
        max={100}
      />
      <p className="text-base-content/60 mt-2 text-sm">
        {stage_label}
        {detail ? ` · ${detail}` : ''}
      </p>
    </div>
  )
}
