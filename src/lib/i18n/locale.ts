import type { JsonValue } from '@/lib/json_value'
import { has_browser_navigator } from '@/lib/boundary_parse'

export type AppLocale = 'en' | 'fr'

export const APP_LOCALES: AppLocale[] = ['en', 'fr']

/** Fallback when the browser language is missing or unsupported. */
export const DEFAULT_LOCALE: AppLocale = 'en'

export function normalize_locale(value: JsonValue | null | undefined): AppLocale {
  return value === 'fr' ? 'fr' : 'en'
}

/** Explicit user preference only — `null` means follow the browser on boot. */
export function normalize_stored_locale(value: JsonValue | null | undefined): AppLocale | null {
  if (value === 'fr' || value === 'en') return value
  return null
}

/**
 * Pick UI locale from the browser (`navigator.languages` then `navigator.language`).
 * Unsupported languages fall back to English.
 */
export function detect_locale(): AppLocale {
  if (!has_browser_navigator()) return DEFAULT_LOCALE

  const candidates = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language,
  ]

  for (const candidate of candidates) {
    const language = candidate?.toLowerCase() ?? ''
    if (language.startsWith('fr')) return 'fr'
    if (language.startsWith('en')) return 'en'
  }

  return DEFAULT_LOCALE
}

/** Resolve active locale: saved preference, else browser, else English. */
export function resolve_locale(stored: AppLocale | null | undefined): AppLocale {
  if (stored === 'fr' || stored === 'en') return stored
  return detect_locale()
}
