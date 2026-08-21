import { useIntl } from 'react-intl'
import { APP_LOCALES, locale_message_key } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { connector, type ConnectorProps } from './locale_switcher.connector'

export function Wrapper({ locale, on_change_locale }: ConnectorProps) {
  const intl = useIntl()

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label={intl.formatMessage({ id: 'app.language' })}
    >
      {APP_LOCALES.map((code) => (
        <Button
          key={code}
          type="button"
          className={
            locale === code ? 'btn-primary btn-sm rounded-full' : 'btn-outline btn-sm rounded-full'
          }
          onClick={() => on_change_locale(code)}
        >
          {intl.formatMessage({ id: locale_message_key(code) })}
        </Button>
      ))}
    </div>
  )
}

export const LocaleSwitcher = connector(Wrapper)
