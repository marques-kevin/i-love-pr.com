import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_LOCALE,
  detect_locale,
  normalize_stored_locale,
  resolve_locale,
} from '@/lib/i18n/locale'

describe('detect_locale', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('prefers French from navigator.languages', () => {
    vi.stubGlobal('navigator', { languages: ['fr-FR', 'en-US'], language: 'en-US' })
    expect(detect_locale()).toBe('fr')
  })

  it('uses English when browser is English', () => {
    vi.stubGlobal('navigator', { languages: ['en-GB'], language: 'en-GB' })
    expect(detect_locale()).toBe('en')
  })

  it('falls back to English for unsupported languages', () => {
    vi.stubGlobal('navigator', { languages: ['de-DE'], language: 'de-DE' })
    expect(detect_locale()).toBe(DEFAULT_LOCALE)
  })
})

describe('resolve_locale', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses an explicit saved preference', () => {
    vi.stubGlobal('navigator', { languages: ['en-US'], language: 'en-US' })
    expect(resolve_locale('fr')).toBe('fr')
  })

  it('detects from the browser when no preference is stored', () => {
    vi.stubGlobal('navigator', { languages: ['fr-CA'], language: 'fr-CA' })
    expect(resolve_locale(null)).toBe('fr')
    expect(resolve_locale(undefined)).toBe('fr')
  })
})

describe('normalize_stored_locale', () => {
  it('keeps only explicit en/fr values', () => {
    expect(normalize_stored_locale('fr')).toBe('fr')
    expect(normalize_stored_locale('en')).toBe('en')
    expect(normalize_stored_locale(undefined)).toBeNull()
    expect(normalize_stored_locale('de')).toBeNull()
  })
})
