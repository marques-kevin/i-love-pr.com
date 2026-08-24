import { describe, expect, it } from 'vitest'
import {
  chunk_array,
  download_import_percent,
  facts_import_percent,
  write_import_percent,
} from '@/lib/import_progress'

describe('import_progress', () => {
  it('chunks arrays for batched writes', () => {
    expect(chunk_array([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk_array([], 250)).toEqual([])
  })

  it('maps download bytes into the 0-30 range', () => {
    expect(download_import_percent(500, 1000)).toBe(15)
    expect(download_import_percent(1000, 1000)).toBe(30)
    expect(download_import_percent(0, null)).toBe(15)
  })

  it('maps written records into the 30-80 range', () => {
    expect(write_import_percent(0, 100)).toBe(30)
    expect(write_import_percent(50, 100)).toBe(55)
    expect(write_import_percent(100, 100)).toBe(80)
    expect(write_import_percent(0, 0)).toBe(55)
  })

  it('reports facts completion at 85 or 100', () => {
    expect(facts_import_percent(false)).toBe(85)
    expect(facts_import_percent(true)).toBe(100)
  })

  it('reports increasing write percent as batches complete', () => {
    const total = 10
    const percents = Array.from({ length: total }, (_, index) =>
      write_import_percent(index + 1, total),
    )
    for (let index = 1; index < percents.length; index++) {
      expect(percents[index]).toBeGreaterThanOrEqual(percents[index - 1]!)
    }
    expect(percents.at(-1)).toBe(80)
  })
})
