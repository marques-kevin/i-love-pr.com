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
export {
  DYNAMICALLY_REFERENCED_MESSAGE_KEYS,
  locale_message_key,
  period_message_key,
  widget_description_key,
  widget_label_key,
  onboarding_scope_message_key,
} from './keys'
export { define_locale_messages } from './define_locale_messages'

export const messages_by_locale = {
  en: { ...en_messages },
  fr: fr_messages,
} satisfies Record<AppLocale, Record<MessageKey, string>>

export { en_messages, fr_messages }
