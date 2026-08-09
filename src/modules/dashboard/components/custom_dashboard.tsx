import { useState } from 'react'
import { ArrowDown, ArrowUp, MoreHorizontal, Plus, Pencil, Trash2, X } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DashboardLayoutItem, DashboardTab, DashboardWidgetId } from '@/lib/types'
import { create_layout_item, DEFAULT_DASHBOARD_ID } from '@/lib/dashboard_layout'
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

function dashboard_tab_label(
  tab: DashboardTab,
  format_message: ReturnType<typeof useIntl>['formatMessage'],
) {
  if (tab.name.trim()) return tab.name
  if (tab.id === DEFAULT_DASHBOARD_ID) {
    return format_message({ id: 'dashboard.default_name' })
  }
  return format_message({ id: 'dashboard.default_name' })
}

export function Wrapper({
  dashboards,
  active_dashboard_id,
  layout,
  save_layout,
  create_dashboard_tab,
  rename_dashboard_tab,
  delete_dashboard_tab,
  set_active_dashboard_id,
}: ConnectorProps) {
  const intl = useIntl()
  const [editing, set_editing] = useState(false)
  const [picker_open, set_picker_open] = useState(false)
  const [preview_widget_id, set_preview_widget_id] = useState<DashboardWidgetId>(
    DASHBOARD_WIDGET_CATALOG[0].widget_id,
  )
  const [create_open, set_create_open] = useState(false)
  const [rename_open, set_rename_open] = useState(false)
  const [delete_open, set_delete_open] = useState(false)
  const [new_name, set_new_name] = useState('')
  const [rename_name, set_rename_name] = useState('')
  const [target_tab_id, set_target_tab_id] = useState<string | null>(null)

  const target_tab = dashboards.find((tab) => tab.id === target_tab_id) ?? null
  const target_label = target_tab
    ? dashboard_tab_label(target_tab, intl.formatMessage)
    : intl.formatMessage({ id: 'dashboard.default_name' })
  const can_delete_tab = dashboards.length > 1

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

  const submit_create = () => {
    const name = new_name.trim()
    if (!name) return
    create_dashboard_tab(name)
    set_new_name('')
    set_create_open(false)
    set_editing(true)
  }

  const open_rename = (tab: DashboardTab) => {
    const label = dashboard_tab_label(tab, intl.formatMessage)
    set_target_tab_id(tab.id)
    set_rename_name(tab.name.trim() ? tab.name : label)
    set_rename_open(true)
  }

  const submit_rename = () => {
    const name = rename_name.trim()
    if (!name || !target_tab) return
    rename_dashboard_tab(target_tab.id, name)
    set_rename_open(false)
    set_target_tab_id(null)
  }

  const open_delete = (tab: DashboardTab) => {
    if (!can_delete_tab) return
    set_target_tab_id(tab.id)
    set_delete_open(true)
  }

  const submit_delete = () => {
    if (!target_tab || !can_delete_tab) return
    delete_dashboard_tab(target_tab.id)
    set_delete_open(false)
    set_target_tab_id(null)
    set_editing(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Tabs
            value={active_dashboard_id}
            onValueChange={(id) => {
              set_editing(false)
              set_active_dashboard_id(id)
            }}
          >
            <TabsList>
              {dashboards.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-1 pr-1">
                  <span>{dashboard_tab_label(tab, intl.formatMessage)}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
                        aria-label={intl.formatMessage({ id: 'dashboard.tab_menu' })}
                        onPointerDown={(event) => {
                          event.stopPropagation()
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                        }}
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-40">
                      <DropdownMenuItem
                        onClick={() => {
                          open_rename(tab)
                        }}
                      >
                        <Pencil className="size-4" />
                        {intl.formatMessage({ id: 'dashboard.rename_tab' })}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={!can_delete_tab}
                        onClick={() => {
                          open_delete(tab)
                        }}
                        title={
                          can_delete_tab
                            ? undefined
                            : intl.formatMessage({ id: 'dashboard.delete_disabled' })
                        }
                      >
                        <Trash2 className="size-4" />
                        {intl.formatMessage({ id: 'dashboard.delete_tab' })}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => {
              set_new_name('')
              set_create_open(true)
            }}
            aria-label={intl.formatMessage({ id: 'dashboard.add_tab' })}
          >
            <Plus className="size-4" />
          </Button>
        </div>
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

      <p className="text-sm text-muted-foreground">
        {editing
          ? intl.formatMessage({ id: 'dashboard.subtitle_editing' })
          : intl.formatMessage({ id: 'dashboard.subtitle' })}
      </p>

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
            <ul className="max-h-[40vh] space-y-1 overflow-y-auto border-b border-border p-3 md:max-h-none md:border-r md:border-b-0">
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

      <Dialog
        open={create_open}
        onOpenChange={(open) => {
          set_create_open(open)
          if (!open) set_new_name('')
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: 'dashboard.create_title' })}</DialogTitle>
            <DialogDescription>
              {intl.formatMessage({ id: 'dashboard.create_description' })}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              submit_create()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="dashboard-name">
                {intl.formatMessage({ id: 'dashboard.create_name_label' })}
              </Label>
              <Input
                id="dashboard-name"
                value={new_name}
                onChange={(event) => set_new_name(event.target.value)}
                placeholder={intl.formatMessage({ id: 'dashboard.create_name_placeholder' })}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => set_create_open(false)}>
                {intl.formatMessage({ id: 'dashboard.create_cancel' })}
              </Button>
              <Button type="submit" disabled={!new_name.trim()}>
                {intl.formatMessage({ id: 'dashboard.create_confirm' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rename_open}
        onOpenChange={(open) => {
          set_rename_open(open)
          if (!open) {
            set_rename_name('')
            set_target_tab_id(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: 'dashboard.rename_title' })}</DialogTitle>
            <DialogDescription>
              {intl.formatMessage({ id: 'dashboard.rename_description' })}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              submit_rename()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="dashboard-rename">
                {intl.formatMessage({ id: 'dashboard.create_name_label' })}
              </Label>
              <Input
                id="dashboard-rename"
                value={rename_name}
                onChange={(event) => set_rename_name(event.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => set_rename_open(false)}>
                {intl.formatMessage({ id: 'dashboard.create_cancel' })}
              </Button>
              <Button type="submit" disabled={!rename_name.trim()}>
                {intl.formatMessage({ id: 'dashboard.rename_confirm' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={delete_open}
        onOpenChange={(open) => {
          set_delete_open(open)
          if (!open) set_target_tab_id(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: 'dashboard.delete_title' })}</DialogTitle>
            <DialogDescription>
              {intl.formatMessage({ id: 'dashboard.delete_description' }, { name: target_label })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => set_delete_open(false)}>
              {intl.formatMessage({ id: 'dashboard.create_cancel' })}
            </Button>
            <Button type="button" variant="destructive" onClick={submit_delete}>
              {intl.formatMessage({ id: 'dashboard.delete_confirm' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const CustomDashboard = connector(Wrapper)
