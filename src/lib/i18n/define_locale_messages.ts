import type { MessageKey } from './messages/en'

/**
 * Define a non-English catalog with exactly the same keys as English.
 * Missing keys → TS error. Extra keys → TS error.
 */
export function define_locale_messages<T extends Record<MessageKey, string>>(
  messages: T & Record<Exclude<keyof T, MessageKey>, never>,
): Record<MessageKey, string> {
  return messages
}
