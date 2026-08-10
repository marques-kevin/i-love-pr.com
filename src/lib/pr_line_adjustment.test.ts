import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_FILE_GLOBS } from './test_file_patterns'
import { adjust_pr_line_counts } from './pr_line_adjustment'
import type { PrChangedFileRecord, PrFactRecord } from './types'

function make_pr(overrides: Partial<PrFactRecord> = {}): PrFactRecord {
  return {
    _version: 8,
    pr_id: 'org/repo#1',
    repo_full_name: 'org/repo',
    author: 'alice',
    state: 'MERGED',
    created_at: '2024-01-01T00:00:00Z',
    merged_at: '2024-01-02T00:00:00Z',
    pr_number: 1,
    title: 'Test PR',
    request_review_at: '2024-01-01T00:00:00Z',
    first_approved_at: null,
    is_bot: false,
    lines_added: 100,
    lines_deleted: 20,
    lines_changed: 120,
    review_rounds: 1,
    cycle: {
      time_from_creation_to_asked_for_review: 0,
      time_from_creation_to_merged: 24,
      time_from_creation_to_approved: null,
      time_from_asked_for_review_to_approved: null,
      time_from_asked_for_review_to_first_review: null,
    },
    ...overrides,
  }
}

function make_file(path: string, additions: number, deletions: number): PrChangedFileRecord {
  return {
    id: `org/repo#1:${path}`,
    pr_id: 'org/repo#1',
    path,
    additions,
    deletions,
  }
}

describe('adjust_pr_line_counts', () => {
  it('subtracts matched test file line counts', () => {
    const files = [make_file('src/app.ts', 80, 10), make_file('src/app.test.ts', 20, 10)]
    const adjusted = adjust_pr_line_counts(make_pr(), files, DEFAULT_TEST_FILE_GLOBS)
    expect(adjusted).toEqual({
      lines_added: 80,
      lines_deleted: 10,
      lines_changed: 90,
    })
  })

  it('never returns negative line counts', () => {
    const files = [make_file('src/foo.test.ts', 200, 50)]
    const adjusted = adjust_pr_line_counts(make_pr(), files, DEFAULT_TEST_FILE_GLOBS)
    expect(adjusted.lines_added).toBe(0)
    expect(adjusted.lines_deleted).toBe(0)
    expect(adjusted.lines_changed).toBe(0)
  })
})
