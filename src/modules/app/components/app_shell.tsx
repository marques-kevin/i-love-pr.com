import { Dashboard } from '@/modules/dashboard'
import { Settings } from '@/modules/settings'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppTopBar } from './app_top_bar'

export function AppShell() {
  return (
    <TooltipProvider>
      <div className="min-h-screen overflow-x-hidden bg-muted dark:bg-background">
        <AppTopBar />
        <main className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8">
          <Dashboard />
        </main>
        <Settings />
      </div>
    </TooltipProvider>
  )
}
