export type AppLocale = 'en' | 'fr'

export const APP_LOCALES: AppLocale[] = ['en', 'fr']

export const DEFAULT_LOCALE: AppLocale = 'en'

export function normalize_locale(value: unknown): AppLocale {
  return value === 'fr' ? 'fr' : 'en'
}

export function detect_locale(): AppLocale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const language = navigator.language?.toLowerCase() ?? ''
  return language.startsWith('fr') ? 'fr' : 'en'
}
