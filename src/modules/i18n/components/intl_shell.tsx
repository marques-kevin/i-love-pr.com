import { useEffect, type ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { messages_by_locale } from '@/lib/i18n'
import { connector, type ConnectorProps } from './intl_shell.connector'

type Props = ConnectorProps & { children: ReactNode }

export function Wrapper({ locale, children }: Props) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <IntlProvider locale={locale} messages={messages_by_locale[locale]} defaultLocale="en">
      {children}
    </IntlProvider>
  )
}

export const IntlShell = connector(Wrapper)
