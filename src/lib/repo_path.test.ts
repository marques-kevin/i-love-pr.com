import { describe, expect, it } from 'vitest'
import {
  active_repo_from_url_or_settings,
  is_known_repo,
  parse_repo_dashboard_path,
  repo_dashboard_path,
  split_repo_full_name,
} from '@/lib/repo_path'

describe('split_repo_full_name', () => {
  it('splits owner and name', () => {
    expect(split_repo_full_name('acme/widgets')).toEqual({ owner: 'acme', name: 'widgets' })
  })

  it('keeps extra segments in the name', () => {
    expect(split_repo_full_name('acme/widgets.foo')).toEqual({
      owner: 'acme',
      name: 'widgets.foo',
    })
  })
})

describe('repo_dashboard_path', () => {
  it('builds a history URL for owner/name', () => {
    expect(repo_dashboard_path('acme/widgets')).toBe('/r/acme/widgets')
  })

  it('encodes special characters', () => {
    expect(repo_dashboard_path('acme/my repo')).toBe('/r/acme/my%20repo')
  })
})

describe('parse_repo_dashboard_path', () => {
  it('reads owner/name from /r/:owner/:name', () => {
    expect(parse_repo_dashboard_path('/r/acme/widgets')).toBe('acme/widgets')
  })

  it('accepts a trailing slash', () => {
    expect(parse_repo_dashboard_path('/r/acme/widgets/')).toBe('acme/widgets')
  })

  it('decodes encoded segments', () => {
    expect(parse_repo_dashboard_path('/r/acme/my%20repo')).toBe('acme/my repo')
  })

  it('rejects home and incomplete paths', () => {
    expect(parse_repo_dashboard_path('/')).toBeNull()
    expect(parse_repo_dashboard_path('/r/acme')).toBeNull()
    expect(parse_repo_dashboard_path('/r/acme/widgets/extra')).toBeNull()
  })

  it('rejects malformed percent-encoding', () => {
    expect(parse_repo_dashboard_path('/r/acme/%E0%A4%A')).toBeNull()
  })
})

describe('is_known_repo', () => {
  it('requires the repo to be listed', () => {
    expect(is_known_repo('acme/widgets', ['acme/widgets'])).toBe(true)
    expect(is_known_repo('acme/other', ['acme/widgets'])).toBe(false)
    expect(is_known_repo(null, ['acme/widgets'])).toBe(false)
  })
})

describe('active_repo_from_url_or_settings', () => {
  it('prefers a known URL repo over persisted settings', () => {
    expect(
      active_repo_from_url_or_settings(
        '/r/acme/widgets',
        ['acme/other', 'acme/widgets'],
        'acme/other',
      ),
    ).toBe('acme/widgets')
  })

  it('falls back to settings when the path is home', () => {
    expect(active_repo_from_url_or_settings('/', ['acme/widgets'], 'acme/widgets')).toBe(
      'acme/widgets',
    )
  })

  it('falls back to settings when the URL repo is unknown', () => {
    expect(
      active_repo_from_url_or_settings('/r/missing/repo', ['acme/widgets'], 'acme/widgets'),
    ).toBe('acme/widgets')
  })

  it('uses the first configured repo when nothing matches', () => {
    expect(active_repo_from_url_or_settings('/', ['acme/a', 'acme/b'], null)).toBe('acme/a')
  })

  it('returns null when there are no repos', () => {
    expect(active_repo_from_url_or_settings('/r/acme/widgets', [], 'acme/widgets')).toBeNull()
  })
})
