import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { APP_LOCALES, type AppLocale } from '@/lib/i18n'
import { connector, type ConnectorProps } from './locale_switcher.connector'

export function Wrapper({ locale, on_change_locale }: ConnectorProps) {
  const intl = useIntl()

  return (
    <div className="flex items-center gap-1" role="group" aria-label={intl.formatMessage({ id: 'app.language' })}>
      {APP_LOCALES.map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant={locale === code ? 'default' : 'outline'}
          onClick={() => on_change_locale(code as AppLocale)}
        >
          {intl.formatMessage({ id: `app.locale.${code}` })}
        </Button>
      ))}
    </div>
  )
}

export const LocaleSwitcher = connector(Wrapper)
