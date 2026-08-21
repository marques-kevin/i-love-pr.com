import { createContext, useContext, useState, type ReactNode } from 'react'
import type { DashboardWidgetId } from '@/lib/types'
import { DASHBOARD_WIDGET_CATALOG } from '../lib/widget_catalog'

type DashboardEditContextValue = {
  editing: boolean
  set_editing: (value: boolean | ((prev: boolean) => boolean)) => void
  picker_open: boolean
  set_picker_open: (open: boolean) => void
  preview_widget_id: DashboardWidgetId
  set_preview_widget_id: (id: DashboardWidgetId) => void
  open_picker: () => void
}

const DashboardEditContext = createContext<DashboardEditContextValue | null>(null)

export function DashboardEditProvider({ children }: { children: ReactNode }) {
  const [editing, set_editing] = useState(false)
  const [picker_open, set_picker_open] = useState(false)
  const [preview_widget_id, set_preview_widget_id] = useState<DashboardWidgetId>(
    DASHBOARD_WIDGET_CATALOG[0].widget_id,
  )

  const open_picker = () => {
    set_preview_widget_id(DASHBOARD_WIDGET_CATALOG[0].widget_id)
    set_picker_open(true)
  }

  return (
    <DashboardEditContext.Provider
      value={{
        editing,
        set_editing,
        picker_open,
        set_picker_open,
        preview_widget_id,
        set_preview_widget_id,
        open_picker,
      }}
    >
      {children}
    </DashboardEditContext.Provider>
  )
}

export function useDashboardEdit() {
  const context = useContext(DashboardEditContext)
  if (!context) {
    throw new Error('useDashboardEdit must be used within DashboardEditProvider')
  }
  return context
}
