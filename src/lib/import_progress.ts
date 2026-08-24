import type { ImportProgressStage } from '@/lib/types'

export const IMPORT_WRITE_CHUNK_SIZE = 50

const STAGE_WEIGHTS = {
  downloading: 5,
  writing_prs: 35,
  writing_reviews: 20,
  writing_files: 15,
  saving_settings: 5,
  building_facts: 20,
} as const satisfies Record<ImportProgressStage, number>

const STAGE_ORDER = [
  'downloading',
  'writing_prs',
  'writing_reviews',
  'writing_files',
  'saving_settings',
  'building_facts',
] as const satisfies readonly ImportProgressStage[]

export function import_progress_percent(progress: {
  stage: ImportProgressStage
  completed: number
  total: number | null
}): number | null {
  const stage_index = STAGE_ORDER.indexOf(progress.stage)
  if (stage_index < 0) return null

  let completed_weight = 0
  for (let index = 0; index < stage_index; index += 1) {
    completed_weight += STAGE_WEIGHTS[STAGE_ORDER[index]]
  }

  const stage_weight = STAGE_WEIGHTS[progress.stage]
  if (progress.total != null && progress.total > 0) {
    completed_weight += (stage_weight * progress.completed) / progress.total
  } else if (progress.stage === 'downloading' || progress.stage === 'saving_settings') {
    completed_weight += stage_weight * 0.5
  }

  return Math.min(100, Math.round(completed_weight))
}

export async function yield_to_main_thread(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })
}
