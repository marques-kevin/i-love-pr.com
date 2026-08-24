import { describe, expect, it } from 'vitest'
import { import_job_percent, should_open_imported_dashboard } from '@/lib/import_job_progress'

describe('import_job_percent', () => {
  it('uses the 3-step ranges when the fraction is unknown', () => {
    expect(import_job_percent('download', null)).toBe(0)
    expect(import_job_percent('prs', null)).toBe(30)
    expect(import_job_percent('facts', null)).toBe(80)
  })

  it('reports increasing percent as work completes', () => {
    const percents = [
      import_job_percent('download', 0),
      import_job_percent('download', 0.5),
      import_job_percent('download', 1),
      import_job_percent('prs', 0),
      import_job_percent('prs', 0.4),
      import_job_percent('prs', 1),
      import_job_percent('facts', 0),
      import_job_percent('facts', 1),
    ]
    for (let index = 1; index < percents.length; index += 1) {
      expect(percents[index]).toBeGreaterThanOrEqual(percents[index - 1] ?? 0)
    }
    expect(percents[0]).toBe(0)
    expect(percents[percents.length - 1]).toBe(100)
  })
})

describe('should_open_imported_dashboard', () => {
  it('navigates from home or a share path only', () => {
    expect(should_open_imported_dashboard('/')).toBe(true)
    expect(should_open_imported_dashboard('/share/abc')).toBe(true)
    expect(should_open_imported_dashboard('/r/acme/widgets')).toBe(false)
  })
})
