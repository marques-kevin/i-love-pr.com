import { useIntl } from 'react-intl'
import { AppChromeHeader } from './app_chrome_header'

type ShareImportErrorProps = {
  error: string | null
}

export function ShareImportError({ error }: ShareImportErrorProps) {
  const intl = useIntl()

  return (
    <div className="min-h-screen">
      <AppChromeHeader />
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-16 sm:px-6">
        <div className="alert alert-error">
          <div>
            <h2 className="font-semibold">
              {intl.formatMessage({ id: 'app.share_import.error_title' })}
            </h2>
            <p className="text-sm">
              {intl.formatMessage({ id: 'app.share_import.error_description' })}
            </p>
            {error ? <p className="mt-2 text-sm opacity-80">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
