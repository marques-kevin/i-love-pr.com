import { describe, expect, it } from 'vitest'
import {
  can_sync_github_repo,
  has_github_token,
  is_imported_repo,
  resolve_app_gate,
  settings_have_repos,
} from '@/lib/app_gate'

const empty_token_imported = {
  token: '',
  repos: ['acme/widgets'],
  imported_repos: ['acme/widgets'],
}

const token_owned = {
  token: 'ghp_x',
  repos: ['acme/app'],
  imported_repos: [],
}

describe('app_gate', () => {
  it('treats a trimmed token as present', () => {
    expect(has_github_token({ token: 'ghp_x' })).toBe(true)
    expect(has_github_token({ token: '   ' })).toBe(false)
    expect(has_github_token({ token: '' })).toBe(false)
    expect(has_github_token(null)).toBe(false)
  })

  it('detects configured repos', () => {
    expect(settings_have_repos({ repos: ['acme/widgets'] })).toBe(true)
    expect(settings_have_repos({ repos: [] })).toBe(false)
    expect(settings_have_repos(null)).toBe(false)
  })

  it('mounts the shell for an empty token plus an imported repo', () => {
    expect(
      resolve_app_gate({
        settings: empty_token_imported,
        settings_loading: false,
        share_import_status: 'success',
        accounts_count: 0,
        adding_account: true,
      }),
    ).toBe('shell')
  })

  it('keeps onboarding when there is no settings and no import', () => {
    expect(
      resolve_app_gate({
        settings: null,
        settings_loading: false,
        share_import_status: 'idle',
        accounts_count: 0,
        adding_account: true,
      }),
    ).toBe('onboarding')
  })

  it('shows the account picker when saved accounts exist and nothing is imported', () => {
    expect(
      resolve_app_gate({
        settings: null,
        settings_loading: false,
        share_import_status: 'idle',
        accounts_count: 2,
        adding_account: false,
      }),
    ).toBe('account_picker')
  })

  it('shows a share-import error instead of onboarding', () => {
    expect(
      resolve_app_gate({
        settings: null,
        settings_loading: false,
        share_import_status: 'error',
        accounts_count: 0,
        adding_account: true,
      }),
    ).toBe('import_error')
  })

  it('stays on loading while a share import is in flight without repos', () => {
    expect(
      resolve_app_gate({
        settings: null,
        settings_loading: false,
        share_import_status: 'pending',
        accounts_count: 0,
        adding_account: true,
      }),
    ).toBe('loading')
  })

  it('does not unmount the shell while a dialog import is pending', () => {
    expect(
      resolve_app_gate({
        settings: token_owned,
        settings_loading: false,
        share_import_status: 'pending',
        accounts_count: 1,
        adding_account: false,
      }),
    ).toBe('shell')
  })

  it('gates GitHub sync on token and imported repos', () => {
    expect(is_imported_repo(empty_token_imported, 'acme/widgets')).toBe(true)
    expect(can_sync_github_repo(empty_token_imported, 'acme/widgets')).toBe(false)
    expect(can_sync_github_repo(token_owned, 'acme/app')).toBe(true)
    expect(can_sync_github_repo(token_owned, null)).toBe(true)
  })
})
