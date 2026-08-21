import { StrictMode, useEffect, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { App } from '@/modules/app'
import { IntlShell } from '@/modules/i18n'
import { init_cuelume } from '@/lib/cuelume'
import { session_manager } from '@/lib/session'

registerSW({ immediate: true })
init_cuelume()

function SessionRoot() {
  const session = useSyncExternalStore(
    session_manager.subscribe,
    session_manager.get_snapshot,
    session_manager.get_snapshot,
  )

  useEffect(() => {
    void session_manager.boot()
  }, [])

  if (!session.ready || !session.store) {
    return (
      <div className="flex min-h-screen items-center justify-center text-base-content/60">
        Loading…
      </div>
    )
  }

  return (
    <Provider store={session.store} key={session.login ?? `guest-${session.adding_account}`}>
      <IntlShell>
        <App />
      </IntlShell>
    </Provider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionRoot />
  </StrictMode>,
)
