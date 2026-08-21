import { cn } from '@/lib/utils'

export function dashboard_tab_button_class_name(is_active: boolean): string {
  return cn(
    'dashboard-tab relative flex shrink-0 items-center gap-1 px-3 py-2 text-sm transition-colors',
    is_active
      ? 'dashboard-tab--active bg-base-100 text-base-content rounded-t-xl'
      : 'text-base-content/60 hover:bg-base-300/40 rounded-t-xl',
  )
}
