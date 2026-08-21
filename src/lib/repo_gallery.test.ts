import { describe, expect, it } from 'vitest'
import { partition_gallery_repos } from '@/lib/repo_gallery'

describe('partition_gallery_repos', () => {
  it('puts repos not in imported_repos into own', () => {
    expect(partition_gallery_repos(['acme/app', 'other/lib'], ['other/lib'])).toEqual({
      own: ['acme/app'],
      imported: ['other/lib'],
    })
  })

  it('preserves repos order in both lists', () => {
    expect(
      partition_gallery_repos(['z/repo', 'a/one', 'm/mid', 'a/two'], ['a/one', 'a/two']),
    ).toEqual({
      own: ['z/repo', 'm/mid'],
      imported: ['a/one', 'a/two'],
    })
  })

  it('treats missing imported_repos as empty', () => {
    expect(partition_gallery_repos(['acme/app'], undefined)).toEqual({
      own: ['acme/app'],
      imported: [],
    })
  })

  it('returns empty lists when repos is empty', () => {
    expect(partition_gallery_repos([], ['acme/app'])).toEqual({
      own: [],
      imported: [],
    })
  })
})
