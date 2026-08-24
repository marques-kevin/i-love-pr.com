import { useState } from 'react'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { Cancel01Icon } from '@/components/icons/cancel_01'
import { PlusSignIcon } from '@/components/icons/plus_sign'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import type { DashboardTab } from '@/lib/types'
import { dashboard_tab_class_name } from '@/modules/dashboard/lib/window_chrome'
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
  chrome,
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
  const can_delete_tab = dashboards.length > 1 && chrome.show_tab_mutations

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
    <div className="flex min-w-0 items-end gap-1">
      <div role="tablist" className="flex min-w-0 items-end px-3">
        {dashboards.map((tab) => {
          const is_active = tab.id === active_dashboard_id
          const label = dashboard_tab_label(tab, intl.formatMessage)
          return (
            <div key={tab.id} className={dashboard_tab_class_name(is_active)}>
              <button
                type="button"
                role="tab"
                aria-selected={is_active}
                className="max-w-40 truncate px-3 py-2 text-left"
                onClick={() => set_active_dashboard_id(tab.id)}
                onDoubleClick={() => {
                  if (chrome.show_tab_mutations) open_rename(tab)
                }}
              >
                {label}
              </button>
              {can_delete_tab ? (
                <button
                  type="button"
                  className="dashboard-chrome-tab__close my-auto mr-1 inline-flex size-4 shrink-0 items-center justify-center rounded-full text-base-content/50 hover:bg-base-300/60 hover:text-base-content"
                  aria-label={intl.formatMessage({ id: 'dashboard.delete_tab' })}
                  onClick={(event) => {
                    event.stopPropagation()
                    open_delete(tab)
                  }}
                >
                  <HoverIcon icon={Cancel01Icon} size={12} />
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      {chrome.show_tab_mutations ? (
        <Button
          type="button"
          className="btn-ghost btn-circle btn-xs mb-1 shrink-0"
          onClick={() => {
            set_new_name('')
            set_create_open(true)
          }}
          aria-label={intl.formatMessage({ id: 'dashboard.add_tab' })}
        >
          <HoverIcon icon={PlusSignIcon} size={16} />
        </Button>
      ) : null}

      {chrome.show_tab_mutations ? (
        <>
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
                <Button
                  type="button"
                  className="btn-outline"
                  onClick={() => set_create_open(false)}
                >
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
                <Button
                  type="button"
                  className="btn-outline"
                  onClick={() => set_rename_open(false)}
                >
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
        </>
      ) : null}
    </div>
  )
}

export const DashboardTabs = connector(Wrapper)
