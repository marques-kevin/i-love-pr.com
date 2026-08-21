import { describe, expect, it } from 'vitest'
import { split_repos_for_gallery } from '@/lib/repo_gallery_sections'
import type { RepoRecord } from '@/lib/types'

function repo(full_name: string, source?: RepoRecord['source']): RepoRecord {
  const [owner, name] = full_name.split('/')
  return {
    full_name,
    owner: owner ?? '',
    name: name ?? '',
    added_at: '2026-01-01T00:00:00.000Z',
    source,
  }
}

describe('split_repos_for_gallery', () => {
  it('puts github repos in my_repositories and imported repos in imported', () => {
    const result = split_repos_for_gallery(
      ['acme/widgets', 'acme/imported', 'acme/other'],
      [repo('acme/imported', 'import'), repo('acme/widgets', 'github')],
    )
    expect(result.my_repositories).toEqual(['acme/widgets', 'acme/other'])
    expect(result.imported).toEqual(['acme/imported'])
  })

  it('treats repos without a record as my_repositories', () => {
    const result = split_repos_for_gallery(['acme/widgets'], [])
    expect(result.my_repositories).toEqual(['acme/widgets'])
    expect(result.imported).toEqual([])
  })
})
