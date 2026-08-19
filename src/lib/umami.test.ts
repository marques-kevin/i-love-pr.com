import { afterEach, describe, expect, it, vi } from 'vitest'
import { get_umami_data_domains, is_umami_tracking_hostname, track_umami_event } from './umami'

describe('is_umami_tracking_hostname', () => {
  it('allows production domains', () => {
    expect(is_umami_tracking_hostname('i-love-pr.com')).toBe(true)
    expect(is_umami_tracking_hostname('www.i-love-pr.com')).toBe(true)
  })

  it('rejects localhost and non-production hosts', () => {
    expect(is_umami_tracking_hostname('localhost')).toBe(false)
    expect(is_umami_tracking_hostname('127.0.0.1')).toBe(false)
    expect(is_umami_tracking_hostname('preview.pages.dev')).toBe(false)
  })
})

describe('get_umami_data_domains', () => {
  it('returns a comma-separated domain list for the tracker script', () => {
    expect(get_umami_data_domains()).toBe('i-love-pr.com,www.i-love-pr.com')
  })
})

describe('track_umami_event', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not throw when window is missing', () => {
    expect(() => track_umami_event('token_saved')).not.toThrow()
  })

  it('does not throw when umami is missing', () => {
    vi.stubGlobal('window', {})
    expect(() => track_umami_event('token_saved')).not.toThrow()
  })

  it('calls track with the event name and no second argument', () => {
    const track = vi.fn()
    vi.stubGlobal('window', { umami: { track } })

    track_umami_event('repository_added')

    expect(track).toHaveBeenCalledOnce()
    expect(track).toHaveBeenCalledWith('repository_added')
    expect(track.mock.calls[0]).toHaveLength(1)
  })

  it('never passes a payload object', () => {
    const track = vi.fn()
    vi.stubGlobal('window', { umami: { track } })

    for (const event of ['token_saved', 'repository_added', 'sync_completed'] as const) {
      track.mockClear()
      track_umami_event(event)
      expect(track).toHaveBeenCalledWith(event)
      expect(track.mock.calls[0]).toHaveLength(1)
    }
  })
})
