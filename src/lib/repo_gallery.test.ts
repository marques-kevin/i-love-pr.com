import { describe, expect, it } from 'vitest'
import { partition_gallery_repos } from '@/lib/repo_gallery'

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
