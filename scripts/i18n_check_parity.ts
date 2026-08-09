/**
 * Ensure every non-English locale has exactly the same keys as English
 * (no missing keys, no extras).
 *
 * Usage: npm run i18n:check-parity
 */
import { APP_LOCALES, type AppLocale } from '../src/lib/i18n/locale.ts'
import { en_messages } from '../src/lib/i18n/messages/en.ts'
import { fr_messages } from '../src/lib/i18n/messages/fr.ts'
import type { MessageKey } from '../src/lib/i18n/messages/en.ts'

const catalogs: Record<Exclude<AppLocale, 'en'>, Record<MessageKey, string>> = {
  fr: fr_messages,
}

function sorted_keys(messages: Record<string, string>): string[] {
  return Object.keys(messages).sort((a, b) => a.localeCompare(b))
}

function main(): void {
  const en_keys = sorted_keys(en_messages)
  const en_set = new Set(en_keys)
  let failed = false

  for (const locale of APP_LOCALES) {
    if (locale === 'en') continue
    const catalog = catalogs[locale]
    if (!catalog) {
      console.error(`[i18n:parity] Missing catalog registration for locale "${locale}"`)
      failed = true
      continue
    }

    const locale_keys = sorted_keys(catalog)
    const locale_set = new Set(locale_keys)

    const missing = en_keys.filter((key) => !locale_set.has(key))
    const extra = locale_keys.filter((key) => !en_set.has(key))

    if (missing.length === 0 && extra.length === 0) {
      console.log(`[i18n:parity] ${locale}: OK (${locale_keys.length} keys)`)
      continue
    }

    failed = true
    console.error(`[i18n:parity] ${locale}: FAILED`)
    if (missing.length > 0) {
      console.error(`  missing (${missing.length}):`)
      for (const key of missing) console.error(`    - ${key}`)
    }
    if (extra.length > 0) {
      console.error(`  extra (${extra.length}):`)
      for (const key of extra) console.error(`    - ${key}`)
    }
  }

  if (failed) {
    process.exitCode = 1
    return
  }

  console.log(`[i18n:parity] All locales match English (${en_keys.length} keys).`)
}

main()
