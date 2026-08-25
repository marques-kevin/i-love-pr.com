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

export function DashboardEditProvider({
  children,
  read_only = false,
}: {
  children: ReactNode
  read_only?: boolean
}) {
  const [editing, set_editing] = useState(false)
  const [picker_open, set_picker_open] = useState(false)
  const [preview_widget_id, set_preview_widget_id] = useState<DashboardWidgetId>(
    DASHBOARD_WIDGET_CATALOG[0].widget_id,
  )

  const open_picker = () => {
    if (read_only) return
    set_preview_widget_id(DASHBOARD_WIDGET_CATALOG[0].widget_id)
    set_picker_open(true)
  }

  const guarded_set_editing = (value: boolean | ((prev: boolean) => boolean)) => {
    if (read_only) return
    set_editing(value)
  }

  return (
    <DashboardEditContext.Provider
      value={{
        editing: read_only ? false : editing,
        set_editing: guarded_set_editing,
        picker_open: read_only ? false : picker_open,
        set_picker_open: read_only ? () => {} : set_picker_open,
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
