import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_FILE_GLOBS, matches_test_file } from './test_file_patterns'

describe('matches_test_file', () => {
  it('matches common test file patterns', () => {
    expect(matches_test_file('src/foo.test.ts', DEFAULT_TEST_FILE_GLOBS)).toBe(true)
    expect(matches_test_file('src/foo.spec.tsx', DEFAULT_TEST_FILE_GLOBS)).toBe(true)
    expect(matches_test_file('src/__tests__/foo.ts', DEFAULT_TEST_FILE_GLOBS)).toBe(true)
    expect(matches_test_file('packages/app/src/__test__/bar.js', DEFAULT_TEST_FILE_GLOBS)).toBe(
      true,
    )
  })

  it('does not match production source files', () => {
    expect(matches_test_file('src/lib/metrics.ts', DEFAULT_TEST_FILE_GLOBS)).toBe(false)
    expect(matches_test_file('src/components/Button.tsx', DEFAULT_TEST_FILE_GLOBS)).toBe(false)
  })

  it('supports custom globs', () => {
    expect(matches_test_file('tests/e2e/login.ts', ['tests/**'])).toBe(true)
    expect(matches_test_file('src/login.ts', ['tests/**'])).toBe(false)
  })
})
