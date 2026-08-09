import { useState } from 'react'
import { MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react'
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
import type { DashboardTab } from '@/lib/types'
import { DEFAULT_DASHBOARD_ID } from '@/lib/dashboard_layout'
import { connector, type ConnectorProps } from './dashboard_tabs.connector'

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
  create_dashboard_tab,
  rename_dashboard_tab,
  delete_dashboard_tab,
  set_active_dashboard_id,
}: ConnectorProps) {
  const intl = useIntl()
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

  const submit_create = () => {
    const name = new_name.trim()
    if (!name) return
    create_dashboard_tab(name)
    set_new_name('')
    set_create_open(false)
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
  }

  return (
    <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
      <Tabs value={active_dashboard_id} onValueChange={set_active_dashboard_id}>
        <TabsList>
          {dashboards.map((tab) => {
            const is_active = tab.id === active_dashboard_id
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1 pr-1">
                <span>{dashboard_tab_label(tab, intl.formatMessage)}</span>
                {is_active && (
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
                )}
              </TabsTrigger>
            )
          })}
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

export const DashboardTabs = connector(Wrapper)
