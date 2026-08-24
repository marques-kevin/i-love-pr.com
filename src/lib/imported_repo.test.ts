import { describe, expect, it } from 'vitest'
import {
  imported_repo_chrome,
  is_imported_active_repo,
  is_imported_repo,
} from '@/lib/imported_repo'

describe('is_imported_repo', () => {
  it('is true when the repo is listed in imported_repos', () => {
    expect(is_imported_repo({ imported_repos: ['acme/imported'] }, 'acme/imported')).toBe(true)
  })

  it('is false for owned repos and missing inputs', () => {
    expect(is_imported_repo({ imported_repos: ['acme/imported'] }, 'acme/owned')).toBe(false)
    expect(is_imported_repo({ imported_repos: [] }, 'acme/owned')).toBe(false)
    expect(is_imported_repo(undefined, 'acme/imported')).toBe(false)
    expect(is_imported_repo({ imported_repos: ['acme/imported'] }, null)).toBe(false)
    expect(is_imported_repo(null, '')).toBe(false)
  })
})

describe('is_imported_active_repo', () => {
  it('prefers the dashboard active repo over settings.active_repo', () => {
    expect(
      is_imported_active_repo(
        { imported_repos: ['acme/imported'], active_repo: 'acme/owned' },
        'acme/imported',
      ),
    ).toBe(true)
    expect(
      is_imported_active_repo(
        { imported_repos: ['acme/imported'], active_repo: 'acme/imported' },
        'acme/owned',
      ),
    ).toBe(false)
  })

  it('falls back to settings.active_repo', () => {
    expect(
      is_imported_active_repo(
        { imported_repos: ['acme/imported'], active_repo: 'acme/imported' },
        null,
      ),
    ).toBe(true)
  })
})

describe('imported_repo_chrome', () => {
  it('hides mutation chrome and shows the snapshot hint when imported', () => {
    expect(imported_repo_chrome(true)).toEqual({
      show_filters: false,
      show_period_picker: false,
      show_sync: false,
      show_settings: false,
      show_customize: false,
      show_tab_mutations: false,
      show_share: false,
      show_imported_hint: true,
    })
  })

  it('keeps owned-repo chrome unchanged', () => {
    expect(imported_repo_chrome(false)).toEqual({
      show_filters: true,
      show_period_picker: true,
      show_sync: true,
      show_settings: true,
      show_customize: true,
      show_tab_mutations: true,
      show_share: true,
      show_imported_hint: false,
    })
  })
})
