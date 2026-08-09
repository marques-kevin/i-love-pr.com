import { describe, expect, it } from 'vitest'
import { isBotLogin, DEFAULT_IGNORED_BOTS } from './bots'

describe('isBotLogin', () => {
  it('matches exact ignored bot login', () => {
    expect(isBotLogin('dependabot[bot]', DEFAULT_IGNORED_BOTS)).toBe(true)
  })

  it('matches login without [bot] suffix when listed', () => {
    expect(isBotLogin('dependabot', DEFAULT_IGNORED_BOTS)).toBe(true)
  })

  it('treats any [bot] suffix as bot', () => {
    expect(isBotLogin('random-helper[bot]', DEFAULT_IGNORED_BOTS)).toBe(true)
  })

  it('returns false for human logins', () => {
    expect(isBotLogin('alice', DEFAULT_IGNORED_BOTS)).toBe(false)
  })
})
