import { Dashboard } from '@/modules/dashboard'
import { Settings } from '@/modules/settings'
import { AppTopBar } from './app_top_bar'

export function AppShell() {
  return (
    <div className="bg-base-200 min-h-screen overflow-x-hidden">
      <AppTopBar />
      <main className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8">
        <Dashboard />
      </main>
      <Settings />
    </div>
  )
}
