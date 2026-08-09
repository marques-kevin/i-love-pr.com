import { describe, expect, it } from 'vitest'
import { get_umami_data_domains, is_umami_tracking_hostname } from './umami'

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
