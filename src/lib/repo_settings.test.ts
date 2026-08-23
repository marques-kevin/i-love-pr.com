import { describe, expect, it } from 'vitest'
import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import { parse_ignored_bots, default_repo_settings } from '@/lib/repo_settings'

describe('repo_settings helpers', () => {
  it('parses ignored bot logins from lines and commas', () => {
    expect(parse_ignored_bots('dependabot\nrenovate, github-actions[bot]')).toEqual([
      'dependabot',
      'renovate',
      'github-actions[bot]',
    ])
  })

  it('builds factory defaults for a repo full name', () => {
    const settings = default_repo_settings('acme/app')
    expect(settings.repo_full_name).toBe('acme/app')
    expect(settings.ignored_bots).toEqual([...DEFAULT_IGNORED_BOTS])
    expect(settings.ignored_bots).not.toBe(DEFAULT_IGNORED_BOTS)
  })
})
