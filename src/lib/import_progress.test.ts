import { describe, expect, it } from 'vitest'
import { import_progress_percent } from '@/lib/import_progress'
import type { ImportProgress } from '@/lib/types'

function progress(
  stage: ImportProgress['stage'],
  completed: number,
  total: number | null,
): ImportProgress {
  return {
    stage,
    completed,
    total,
    repo_full_name: 'acme/widgets',
    share_link: 'https://example.com/?import=abc',
  }
}

describe('import_progress_percent', () => {
  it('returns null-weighted percent for empty totals', () => {
    expect(import_progress_percent(progress('writing_prs', 0, 0))).toBeGreaterThanOrEqual(0)
  })

  it('increases as PR writes complete', () => {
    const start = import_progress_percent(progress('writing_prs', 0, 100)) ?? 0
    const mid = import_progress_percent(progress('writing_prs', 50, 100)) ?? 0
    const end = import_progress_percent(progress('writing_prs', 100, 100)) ?? 0
    expect(mid).toBeGreaterThan(start)
    expect(end).toBeGreaterThan(mid)
    expect(end).toBeLessThanOrEqual(100)
  })

  it('reaches 100 only on the final stage completion', () => {
    const value = import_progress_percent(progress('building_facts', 10, 10))
    expect(value).toBe(100)
  })
})
