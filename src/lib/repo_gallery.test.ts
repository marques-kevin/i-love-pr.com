import { describe, expect, it } from 'vitest'
import { is_imported_repo, partition_gallery_repos } from '@/lib/repo_gallery'

describe('partition_gallery_repos', () => {
  it('splits repos into own and imported while preserving order', () => {
    const result = partition_gallery_repos(
      ['acme/widgets', 'acme/imported', 'acme/other'],
      ['acme/imported'],
    )
    expect(result.own).toEqual(['acme/widgets', 'acme/other'])
    expect(result.imported).toEqual(['acme/imported'])
  })

  it('treats missing imported_repos as empty', () => {
    const result = partition_gallery_repos(['acme/widgets'], undefined)
    expect(result.own).toEqual(['acme/widgets'])
    expect(result.imported).toEqual([])
  })
})

describe('is_imported_repo', () => {
  it('returns true when the repo is listed in imported_repos', () => {
    expect(is_imported_repo({ imported_repos: ['acme/imported'] }, 'acme/imported')).toBe(true)
  })

  it('returns false for owned repos and missing settings', () => {
    expect(is_imported_repo({ imported_repos: ['acme/imported'] }, 'acme/widgets')).toBe(false)
    expect(is_imported_repo(undefined, 'acme/imported')).toBe(false)
    expect(is_imported_repo({ imported_repos: undefined }, 'acme/imported')).toBe(false)
  })
})
