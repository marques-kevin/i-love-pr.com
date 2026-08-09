import { describe, expect, it } from 'vitest'
import {
  analyze_token_scopes,
  detect_token_type,
  OVERLY_PERMISSIVE_SCOPES,
} from './github_token_scopes'

describe('detect_token_type', () => {
  it('detects fine-grained PATs', () => {
    expect(detect_token_type('github_pat_11AAAA')).toBe('fine_grained')
  })

  it('detects classic PATs', () => {
    expect(detect_token_type('ghp_abc123')).toBe('classic')
  })

  it('returns unknown for unrecognized prefixes', () => {
    expect(detect_token_type('token')).toBe('unknown')
  })
})

describe('analyze_token_scopes', () => {
  it('marks public_repo as sufficient for required access', () => {
    const analysis = analyze_token_scopes(['public_repo'], 'classic')
    expect(analysis.has_required_access).toBe(true)
    expect(analysis.overly_permissive_scopes).toEqual([])
    expect(analysis.can_use_more_restrictive).toBe(false)
  })

  it('treats repo scope as satisfying public_repo', () => {
    const analysis = analyze_token_scopes(['repo'], 'classic')
    expect(analysis.has_required_access).toBe(true)
    expect(analysis.can_use_more_restrictive).toBe(true)
    const public_repo = analysis.scopes.find((s) => s.scope === 'public_repo')
    expect(public_repo?.status).toBe('not_applicable')
  })

  it('flags missing required scopes', () => {
    const analysis = analyze_token_scopes(['read:user'], 'classic')
    expect(analysis.has_required_access).toBe(false)
    const public_repo = analysis.scopes.find((s) => s.scope === 'public_repo')
    expect(public_repo?.status).toBe('missing')
  })

  it('warns on overly permissive scopes', () => {
    const analysis = analyze_token_scopes(['repo', 'delete_repo', 'gist'], 'classic')
    expect(analysis.overly_permissive_scopes).toEqual(['delete_repo', 'gist'])
    expect(OVERLY_PERMISSIVE_SCOPES).toContain('delete_repo')
  })

  it('skips scope analysis for fine-grained tokens', () => {
    const analysis = analyze_token_scopes([], 'fine_grained')
    expect(analysis.scopes).toEqual([])
    expect(analysis.has_required_access).toBe(true)
  })
})
