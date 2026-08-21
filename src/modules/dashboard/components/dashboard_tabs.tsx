import { useState } from 'react'
import { useIntl } from 'react-intl'
import { Delete02Icon } from '@/components/icons/delete_02'
import { Edit02Icon } from '@/components/icons/edit_02'
import { MoreHorizontalIcon } from '@/components/icons/more_horizontal'
import { PlusSignIcon } from '@/components/icons/plus_sign'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { close_daisy_dropdown } from '@/lib/daisy'
import type { DashboardTab } from '@/lib/types'
import { cn } from '@/lib/utils'
import { connector, type ConnectorProps } from './dashboard_tabs.connector'

function dashboard_tab_label(
  tab: DashboardTab,
  format_message: ReturnType<typeof useIntl>['formatMessage'],
) {
  if (tab.name.trim()) return tab.name
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
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div role="tablist" className="tabs tabs-box tabs-sm">
        {dashboards.map((tab) => {
          const is_active = tab.id === active_dashboard_id
          return (
            <div key={tab.id} className="flex items-center">
              <button
                type="button"
                role="tab"
                className={cn('tab', is_active && 'tab-active')}
                onClick={() => set_active_dashboard_id(tab.id)}
              >
                {dashboard_tab_label(tab, intl.formatMessage)}
              </button>
              {is_active ? (
                <div className="dropdown dropdown-bottom">
                  <button
                    type="button"
                    tabIndex={0}
                    className="btn btn-ghost btn-circle btn-xs"
                    aria-label={intl.formatMessage({ id: 'dashboard.tab_menu' })}
                  >
                    <MoreHorizontalIcon size={14} aria-hidden={true} />
                  </button>
                  <ul
                    tabIndex={-1}
                    className="dropdown-content menu bg-base-100 rounded-box z-50 min-w-40 p-2 shadow"
                  >
                    <li>
                      <button
                        type="button"
                        onClick={(event) => {
                          open_rename(tab)
                          close_daisy_dropdown(event.currentTarget)
                        }}
                      >
                        <Edit02Icon size={16} aria-hidden={true} />
                        {intl.formatMessage({ id: 'dashboard.rename_tab' })}
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        disabled={!can_delete_tab}
                        title={
                          can_delete_tab
                            ? undefined
                            : intl.formatMessage({ id: 'dashboard.delete_disabled' })
                        }
                        className="text-error"
                        onClick={(event) => {
                          open_delete(tab)
                          close_daisy_dropdown(event.currentTarget)
                        }}
                      >
                        <Delete02Icon size={16} aria-hidden={true} />
                        {intl.formatMessage({ id: 'dashboard.delete_tab' })}
                      </button>
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <Button
        type="button"
        className="btn-outline btn-square btn-sm"
        onClick={() => {
          set_new_name('')
          set_create_open(true)
        }}
        aria-label={intl.formatMessage({ id: 'dashboard.add_tab' })}
      >
        <PlusSignIcon size={16} aria-hidden={true} />
      </Button>

      <Modal
        open={create_open}
        on_close={() => {
          set_create_open(false)
          set_new_name('')
        }}
        box_className="max-w-md"
      >
        <h3 className="font-display text-lg font-semibold">
          {intl.formatMessage({ id: 'dashboard.create_title' })}
        </h3>
        <p className="text-base-content/60 mt-1 text-sm">
          {intl.formatMessage({ id: 'dashboard.create_description' })}
        </p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            submit_create()
          }}
        >
          <label className="form-control w-full">
            <span className="label">
              {intl.formatMessage({ id: 'dashboard.create_name_label' })}
            </span>
            <Input
              id="dashboard-name"
              value={new_name}
              onChange={(event) => set_new_name(event.target.value)}
              placeholder={intl.formatMessage({ id: 'dashboard.create_name_placeholder' })}
              autoFocus
            />
          </label>
          <div className="modal-action">
            <Button type="button" className="btn-outline" onClick={() => set_create_open(false)}>
              {intl.formatMessage({ id: 'dashboard.create_cancel' })}
            </Button>
            <Button type="submit" className="btn-primary" disabled={!new_name.trim()}>
              {intl.formatMessage({ id: 'dashboard.create_confirm' })}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={rename_open}
        on_close={() => {
          set_rename_open(false)
          set_rename_name('')
          set_target_tab_id(null)
        }}
        box_className="max-w-md"
      >
        <h3 className="font-display text-lg font-semibold">
          {intl.formatMessage({ id: 'dashboard.rename_title' })}
        </h3>
        <p className="text-base-content/60 mt-1 text-sm">
          {intl.formatMessage({ id: 'dashboard.rename_description' })}
        </p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            submit_rename()
          }}
        >
          <label className="form-control w-full">
            <span className="label">
              {intl.formatMessage({ id: 'dashboard.create_name_label' })}
            </span>
            <Input
              id="dashboard-rename"
              value={rename_name}
              onChange={(event) => set_rename_name(event.target.value)}
              autoFocus
            />
          </label>
          <div className="modal-action">
            <Button type="button" className="btn-outline" onClick={() => set_rename_open(false)}>
              {intl.formatMessage({ id: 'dashboard.create_cancel' })}
            </Button>
            <Button type="submit" className="btn-primary" disabled={!rename_name.trim()}>
              {intl.formatMessage({ id: 'dashboard.rename_confirm' })}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={delete_open}
        on_close={() => {
          set_delete_open(false)
          set_target_tab_id(null)
        }}
        box_className="max-w-md"
      >
        <h3 className="font-display text-lg font-semibold">
          {intl.formatMessage({ id: 'dashboard.delete_title' })}
        </h3>
        <p className="text-base-content/60 mt-1 text-sm">
          {intl.formatMessage({ id: 'dashboard.delete_description' }, { name: target_label })}
        </p>
        <div className="modal-action">
          <Button type="button" className="btn-outline" onClick={() => set_delete_open(false)}>
            {intl.formatMessage({ id: 'dashboard.create_cancel' })}
          </Button>
          <Button type="button" className="btn-error" onClick={submit_delete}>
            {intl.formatMessage({ id: 'dashboard.delete_confirm' })}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export const DashboardTabs = connector(Wrapper)
