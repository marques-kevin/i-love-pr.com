import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Pencil, Trash2, X } from 'lucide-react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { DashboardLayoutItem, DashboardWidgetId } from '@/lib/types'
import { create_layout_item } from '@/lib/dashboard_layout'
import { widget_description_key, widget_label_key } from '@/lib/i18n'
import { DASHBOARD_WIDGET_BY_ID, DASHBOARD_WIDGET_CATALOG } from '../lib/widget_catalog'
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
  const intl = useIntl()
  const [editing, set_editing] = useState(false)
  const [picker_open, set_picker_open] = useState(false)
  const [preview_widget_id, set_preview_widget_id] = useState<DashboardWidgetId>(
    DASHBOARD_WIDGET_CATALOG[0].widget_id,
  )

  const open_picker = () => {
    set_preview_widget_id(DASHBOARD_WIDGET_CATALOG[0].widget_id)
    set_picker_open(true)
  }

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
            ? intl.formatMessage({ id: 'dashboard.subtitle_editing' })
            : intl.formatMessage({ id: 'dashboard.subtitle' })}
        </p>
        <div className="flex flex-wrap gap-2">
          {editing && (
            <Button type="button" variant="outline" size="sm" onClick={open_picker}>
              <Plus className="size-4" />
              {intl.formatMessage({ id: 'dashboard.add_chart' })}
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
                {intl.formatMessage({ id: 'dashboard.done' })}
              </>
            ) : (
              <>
                <Pencil className="size-4" />
                {intl.formatMessage({ id: 'dashboard.customize' })}
              </>
            )}
          </Button>
        </div>
      </div>

      {layout.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-foreground">
            {intl.formatMessage({ id: 'dashboard.empty_title' })}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'dashboard.empty_body' })}
          </p>
          <Button
            type="button"
            className="mt-6"
            onClick={() => {
              set_editing(true)
              open_picker()
            }}
          >
            <Plus className="size-4" />
            {intl.formatMessage({ id: 'dashboard.add_chart' })}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {layout.map((item, index) => {
            const meta = DASHBOARD_WIDGET_BY_ID[item.widget_id]
            const label = intl.formatMessage({ id: widget_label_key(item.widget_id) })
            const span_class = meta.span === 'full' ? 'lg:col-span-2' : ''
            return (
              <div key={item.instance_id} className={`relative min-w-0 ${span_class}`}>
                {editing && (
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={index === 0}
                        onClick={() => save_layout(move_item(layout, item.instance_id, -1))}
                        aria-label={intl.formatMessage({ id: 'dashboard.move_up' })}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={index === layout.length - 1}
                        onClick={() => save_layout(move_item(layout, item.instance_id, 1))}
                        aria-label={intl.formatMessage({ id: 'dashboard.move_down' })}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove_widget(item.instance_id)}
                        aria-label={intl.formatMessage({ id: 'dashboard.remove' }, { label })}
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

      <Dialog
        open={picker_open}
        onOpenChange={(open) => {
          set_picker_open(open)
          if (open) set_preview_widget_id(DASHBOARD_WIDGET_CATALOG[0].widget_id)
        }}
      >
        <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
            <DialogTitle>{intl.formatMessage({ id: 'dashboard.add_title' })}</DialogTitle>
            <DialogDescription>
              {intl.formatMessage({ id: 'dashboard.add_description' })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(14rem,18rem)_1fr]">
            <ul className="max-h-[40vh] space-y-1 overflow-y-auto border-b border-border p-3 md:max-h-none md:border-b-0 md:border-r">
              {DASHBOARD_WIDGET_CATALOG.map((widget) => {
                const selected = widget.widget_id === preview_widget_id
                return (
                  <li key={widget.widget_id}>
                    <button
                      type="button"
                      className={`flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2.5 text-left transition-colors ${
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted/60 text-foreground'
                      }`}
                      onClick={() => set_preview_widget_id(widget.widget_id)}
                      aria-pressed={selected}
                    >
                      <span className="text-sm font-medium">
                        {intl.formatMessage({ id: widget_label_key(widget.widget_id) })}
                      </span>
                      <span
                        className={`text-xs ${selected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                      >
                        {intl.formatMessage({ id: widget_description_key(widget.widget_id) })}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="flex min-h-0 flex-col">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
                <p className="text-sm font-medium text-foreground">
                  {intl.formatMessage({ id: 'dashboard.add_preview' })}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {intl.formatMessage({ id: widget_label_key(preview_widget_id) })}
                  </span>
                </p>
              </div>
              <div className="min-h-[16rem] flex-1 overflow-y-auto p-4 md:min-h-[22rem]">
                <div key={preview_widget_id} className="min-w-0">
                  <DashboardWidget widget_id={preview_widget_id} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0">
            <Button type="button" variant="outline" onClick={() => set_picker_open(false)}>
              {intl.formatMessage({ id: 'dashboard.add_cancel' })}
            </Button>
            <Button type="button" onClick={() => add_widget(preview_widget_id)}>
              <Plus className="size-4" />
              {intl.formatMessage({ id: 'dashboard.add_confirm' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const CustomDashboard = connector(Wrapper)
