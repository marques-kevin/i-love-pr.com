import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { DashboardLayoutItem, DashboardWidgetId } from '@/lib/types'
import { create_layout_item } from '@/lib/dashboard_layout'
import {
  DASHBOARD_WIDGET_BY_ID,
  DASHBOARD_WIDGET_CATALOG,
} from '../lib/widget_catalog'
import { connector, type ConnectorProps } from './custom_dashboard.connector'
import { DashboardWidget } from './dashboard_widget'

function move_item(layout: DashboardLayoutItem[], instance_id: string, delta: number) {
  const index = layout.findIndex((item) => item.instance_id === instance_id)
  if (index < 0) return layout
  const next_index = index + delta
  if (next_index < 0 || next_index >= layout.length) return layout
  const next = [...layout]
  const [item] = next.splice(index, 1)
  next.splice(next_index, 0, item)
  return next
}

export function Wrapper({ layout, save_layout }: ConnectorProps) {
  const [editing, set_editing] = useState(false)
  const [picker_open, set_picker_open] = useState(false)

  const add_widget = (widget_id: DashboardWidgetId) => {
    save_layout([...layout, create_layout_item(widget_id)])
    set_picker_open(false)
  }

  const remove_widget = (instance_id: string) => {
    save_layout(layout.filter((item) => item.instance_id !== instance_id))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {editing
            ? 'Add, reorder, or remove charts on your dashboard.'
            : 'Your custom dashboard'}
        </p>
        <div className="flex flex-wrap gap-2">
          {editing && (
            <Button type="button" variant="outline" size="sm" onClick={() => set_picker_open(true)}>
              <Plus className="size-4" />
              Add chart
            </Button>
          )}
          <Button
            type="button"
            variant={editing ? 'default' : 'outline'}
            size="sm"
            onClick={() => set_editing((value) => !value)}
          >
            {editing ? (
              <>
                <X className="size-4" />
                Done
              </>
            ) : (
              <>
                <Pencil className="size-4" />
                Customize
              </>
            )}
          </Button>
        </div>
      </div>

      {layout.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-foreground">No charts yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick prefabricated charts to build your dashboard.
          </p>
          <Button
            type="button"
            className="mt-6"
            onClick={() => {
              set_editing(true)
              set_picker_open(true)
            }}
          >
            <Plus className="size-4" />
            Add chart
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {layout.map((item, index) => {
            const meta = DASHBOARD_WIDGET_BY_ID[item.widget_id]
            const span_class = meta.span === 'full' ? 'lg:col-span-2' : ''
            return (
              <div key={item.instance_id} className={`relative min-w-0 ${span_class}`}>
                {editing && (
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                    <span className="text-sm font-medium text-foreground">{meta.label}</span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={index === 0}
                        onClick={() => save_layout(move_item(layout, item.instance_id, -1))}
                        aria-label="Move up"
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={index === layout.length - 1}
                        onClick={() => save_layout(move_item(layout, item.instance_id, 1))}
                        aria-label="Move down"
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove_widget(item.instance_id)}
                        aria-label={`Remove ${meta.label}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <DashboardWidget widget_id={item.widget_id} />
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={picker_open} onOpenChange={set_picker_open}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a chart</DialogTitle>
            <DialogDescription>
              Choose a prefabricated chart to add to your dashboard.
            </DialogDescription>
          </DialogHeader>
          <ul className="mt-2 space-y-2">
            {DASHBOARD_WIDGET_CATALOG.map((widget) => (
              <li key={widget.widget_id}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start gap-1 rounded-md border border-border px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  onClick={() => add_widget(widget.widget_id)}
                >
                  <span className="font-medium text-foreground">{widget.label}</span>
                  <span className="text-sm text-muted-foreground">{widget.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const CustomDashboard = connector(Wrapper)
