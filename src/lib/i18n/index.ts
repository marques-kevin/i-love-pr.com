import type { AppLocale } from './locale'
import { en_messages, type MessageKey } from './messages/en'
import { fr_messages } from './messages/fr'

export type { AppLocale, MessageKey }
export {
  APP_LOCALES,
  DEFAULT_LOCALE,
  detect_locale,
  normalize_locale,
  normalize_stored_locale,
  resolve_locale,
} from './locale'

export const messages_by_locale: Record<AppLocale, Record<MessageKey, string>> = {
  en: en_messages,
  fr: fr_messages,
}
