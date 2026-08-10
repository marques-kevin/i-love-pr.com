import { Dashboard, DashboardTabs } from '@/modules/dashboard'
import { Settings } from '@/modules/settings'
import { SyncStatus } from '@/modules/sync'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from './app_sidebar'

export function AppShell() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" data-cuelume-press="" data-cuelume-release="" />
            <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
            <div className="min-w-0 flex-1">
              <DashboardTabs />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <SyncStatus />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Dashboard />
          </div>
          <Settings />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
