import { matches_test_file } from './test_file_patterns'
import type { PrChangedFileRecord, PrFactRecord } from './types'

export function adjust_pr_line_counts(
  pr: PrFactRecord,
  changed_files: PrChangedFileRecord[],
  test_file_globs: string[],
): Pick<PrFactRecord, 'lines_added' | 'lines_deleted' | 'lines_changed'> {
  let test_additions = 0
  let test_deletions = 0
  for (const file of changed_files) {
    if (matches_test_file(file.path, test_file_globs)) {
      test_additions += file.additions
      test_deletions += file.deletions
    }
  }
  const lines_added = Math.max(0, pr.lines_added - test_additions)
  const lines_deleted = Math.max(0, pr.lines_deleted - test_deletions)
  return {
    lines_added,
    lines_deleted,
    lines_changed: lines_added + lines_deleted,
  }
}

export function apply_test_file_line_filter(
  pr: PrFactRecord,
  changed_files: PrChangedFileRecord[],
  test_file_globs: string[],
): PrFactRecord {
  return {
    ...pr,
    ...adjust_pr_line_counts(pr, changed_files, test_file_globs),
  }
}
