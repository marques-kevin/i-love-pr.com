import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { build_import_link_from_param, consume_home_import_url_param } from '@/lib/import_link'

describe('import_link', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        origin: 'https://i-love-pr.com',
        pathname: '/',
        search: '',
        hash: '',
      },
      history: {
        replaceState: vi.fn(),
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds a full import URL from a bare share id', () => {
    expect(build_import_link_from_param('abc123')).toBe('https://i-love-pr.com/?import=abc123')
  })

  it('keeps absolute URLs unchanged', () => {
    expect(build_import_link_from_param('https://example.com/?import=abc')).toBe(
      'https://example.com/?import=abc',
    )
  })

  it('consumes import params on the home page', () => {
    window.location.search = '?import=abc123'
    expect(consume_home_import_url_param()).toBe('https://i-love-pr.com/?import=abc123')
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/')
  })

  it('ignores import params outside the home page', () => {
    window.location.pathname = '/r/acme/app'
    window.location.search = '?import=abc123'
    expect(consume_home_import_url_param()).toBeNull()
  })
})
