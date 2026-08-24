import { describe, expect, it } from 'vitest'
import { imported_dashboard_chrome, select_is_imported } from './imported_dashboard'

describe('select_is_imported', () => {
  it('returns true when the repo is listed in imported_repos', () => {
    expect(select_is_imported({ imported_repos: ['acme/imported'] }, 'acme/imported')).toBe(true)
  })

  it('returns false for owned repos and missing settings', () => {
    expect(select_is_imported({ imported_repos: ['acme/imported'] }, 'acme/widgets')).toBe(false)
    expect(select_is_imported(undefined, 'acme/imported')).toBe(false)
    expect(select_is_imported(null, 'acme/imported')).toBe(false)
  })
})

describe('imported_dashboard_chrome', () => {
  it('hides mutation chrome for imported snapshots', () => {
    expect(imported_dashboard_chrome(true)).toEqual({
      show_toolbar: false,
      show_customize_fab: false,
      show_settings: false,
      show_sync_status: false,
      show_tab_mutations: false,
      show_edit_chrome: false,
    })
  })

  it('keeps full chrome for owned repos', () => {
    expect(imported_dashboard_chrome(false)).toEqual({
      show_toolbar: true,
      show_customize_fab: true,
      show_settings: true,
      show_sync_status: true,
      show_tab_mutations: true,
      show_edit_chrome: true,
    })
  })
})
