import { describe, expect, it } from 'vitest'
import {
  mark_repo_imported,
  merge_pat_repo_sources,
  normalize_repo_sources,
  parse_repo_sources,
  repo_source_for,
} from '@/lib/repo_sources'

describe('repo_sources', () => {
  it('defaults unknown repos to pat', () => {
    expect(normalize_repo_sources(['acme/app'])).toEqual({ 'acme/app': 'pat' })
  })

  it('preserves import sources when normalizing', () => {
    expect(normalize_repo_sources(['acme/app'], { 'acme/app': 'import' })).toEqual({
      'acme/app': 'import',
    })
  })

  it('marks only new repos as pat without overwriting import', () => {
    expect(merge_pat_repo_sources(['acme/app', 'acme/other'], { 'acme/app': 'import' })).toEqual({
      'acme/app': 'import',
      'acme/other': 'pat',
    })
  })

  it('marks imported repos explicitly', () => {
    expect(mark_repo_imported(['acme/app'], {}, 'acme/app')).toEqual({ 'acme/app': 'import' })
  })

  it('parses stored repo_sources objects', () => {
    expect(parse_repo_sources({ 'acme/app': 'import', ignored: 'bad' })).toEqual({
      'acme/app': 'import',
    })
  })

  it('falls back to pat when source is missing', () => {
    expect(repo_source_for('acme/app', {})).toBe('pat')
    expect(repo_source_for('acme/app', { 'acme/app': 'import' })).toBe('import')
  })
})
