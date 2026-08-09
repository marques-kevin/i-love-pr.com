import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { App } from '@/modules/app'
import { global_app_initialized } from '@/modules/app/redux/app_events'
import { db } from './lib/db'
import { create_dexie_repositories } from './repositories'
import { create_store } from './store'

registerSW({ immediate: true })

const store = create_store({
  repositories: create_dexie_repositories(db),
})

store.dispatch(global_app_initialized())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
