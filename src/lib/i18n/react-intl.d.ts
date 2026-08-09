import type { MessageKey } from './messages/en'
import type { AppLocale } from './locale'

declare global {
  namespace FormatjsIntl {
    interface Message {
      ids: MessageKey
    }
    interface IntlConfig {
      locale: AppLocale
    }
  }
}

export {}
