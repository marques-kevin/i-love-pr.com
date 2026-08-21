import { useState } from 'react'
import { useIntl } from 'react-intl'
import { ArrowDown02Icon } from '@/components/icons/arrow_down_02'
import { ArrowUp02Icon } from '@/components/icons/arrow_up_02'
import { Cancel01Icon } from '@/components/icons/cancel_01'
import { Delete02Icon } from '@/components/icons/delete_02'
import { Edit02Icon } from '@/components/icons/edit_02'
import { PlusSignIcon } from '@/components/icons/plus_sign'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { DashboardLayoutItem, DashboardWidgetId } from '@/lib/types'
import { create_layout_item } from '@/lib/dashboard_layout'
import { widget_description_key, widget_label_key } from '@/lib/i18n'
import { DASHBOARD_WIDGET_CATALOG, get_dashboard_widget_meta } from '../lib/widget_catalog'
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
        <p className="text-base-content/60 text-sm">
          {editing
            ? intl.formatMessage({ id: 'dashboard.subtitle_editing' })
            : intl.formatMessage({ id: 'dashboard.subtitle' })}
        </p>
        <div className="flex flex-wrap gap-2">
          {editing && (
            <Button type="button" className="btn-outline btn-sm" onClick={open_picker}>
              <PlusSignIcon size={16} aria-hidden={true} />
              {intl.formatMessage({ id: 'dashboard.add_chart' })}
            </Button>
          )}
          <Button
            type="button"
            className={editing ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
            onClick={() => set_editing((value) => !value)}
          >
            {editing ? (
              <>
                <Cancel01Icon size={16} aria-hidden={true} />
                {intl.formatMessage({ id: 'dashboard.done' })}
              </>
            ) : (
              <>
                <Edit02Icon size={16} aria-hidden={true} />
                {intl.formatMessage({ id: 'dashboard.customize' })}
              </>
            )}
          </Button>
        </div>
      </div>

      {layout.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">
            {intl.formatMessage({ id: 'dashboard.empty_title' })}
          </p>
          <p className="text-base-content/60 mt-2 text-sm">
            {intl.formatMessage({ id: 'dashboard.empty_body' })}
          </p>
          <Button
            type="button"
            className="btn-primary mt-6"
            onClick={() => {
              set_editing(true)
              open_picker()
            }}
          >
            <PlusSignIcon size={16} aria-hidden={true} />
            {intl.formatMessage({ id: 'dashboard.add_chart' })}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {layout.map((item, index) => {
            const meta = get_dashboard_widget_meta(item.widget_id)
            const label = intl.formatMessage({ id: widget_label_key(item.widget_id) })
            const span_class = meta.span === 'full' ? 'lg:col-span-2' : ''
            return (
              <div key={item.instance_id} className={`relative min-w-0 ${span_class}`}>
                {editing && (
                  <div className="bg-base-200/40 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 px-3 py-2">
                    <span className="text-sm font-medium">{label}</span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        className="btn-ghost btn-square btn-xs"
                        disabled={index === 0}
                        onClick={() => save_layout(move_item(layout, item.instance_id, -1))}
                        aria-label={intl.formatMessage({ id: 'dashboard.move_up' })}
                      >
                        <ArrowUp02Icon size={16} aria-hidden={true} />
                      </Button>
                      <Button
                        type="button"
                        className="btn-ghost btn-square btn-xs"
                        disabled={index === layout.length - 1}
                        onClick={() => save_layout(move_item(layout, item.instance_id, 1))}
                        aria-label={intl.formatMessage({ id: 'dashboard.move_down' })}
                      >
                        <ArrowDown02Icon size={16} aria-hidden={true} />
                      </Button>
                      <Button
                        type="button"
                        className="btn-ghost btn-square btn-xs"
                        onClick={() => remove_widget(item.instance_id)}
                        aria-label={intl.formatMessage({ id: 'dashboard.remove' }, { label })}
                      >
                        <Delete02Icon size={16} aria-hidden={true} />
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

      <Modal
        open={picker_open}
        on_close={() => set_picker_open(false)}
        box_className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden p-0"
        hide_close={false}
      >
        <div className="shrink-0 border-b border-base-300 px-6 py-4 pr-12">
          <h3 className="font-display text-lg font-semibold">
            {intl.formatMessage({ id: 'dashboard.add_title' })}
          </h3>
          <p className="text-base-content/60 mt-1 text-sm">
            {intl.formatMessage({ id: 'dashboard.add_description' })}
          </p>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(14rem,18rem)_1fr]">
          <ul className="menu max-h-[40vh] w-full rounded-none border-b border-base-300 p-3 md:max-h-none md:border-r md:border-b-0">
            {DASHBOARD_WIDGET_CATALOG.map((widget) => {
              const selected = widget.widget_id === preview_widget_id
              return (
                <li key={widget.widget_id}>
                  <button
                    type="button"
                    className={selected ? 'menu-active' : undefined}
                    onClick={() => set_preview_widget_id(widget.widget_id)}
                    aria-pressed={selected}
                  >
                    <span className="flex flex-col items-start gap-0.5">
                      <span className="text-sm font-medium">
                        {intl.formatMessage({ id: widget_label_key(widget.widget_id) })}
                      </span>
                      <span
                        className={
                          selected
                            ? 'text-primary-content/80 text-xs'
                            : 'text-base-content/60 text-xs'
                        }
                      >
                        {intl.formatMessage({ id: widget_description_key(widget.widget_id) })}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-base-300 px-4 py-2">
              <p className="text-sm font-medium">
                {intl.formatMessage({ id: 'dashboard.add_preview' })}
                <span className="text-base-content/60 ml-2 font-normal">
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

        <div className="modal-action mx-6 mb-6">
          <Button type="button" className="btn-outline" onClick={() => set_picker_open(false)}>
            {intl.formatMessage({ id: 'dashboard.add_cancel' })}
          </Button>
          <Button
            type="button"
            className="btn-primary"
            onClick={() => add_widget(preview_widget_id)}
          >
            <PlusSignIcon size={16} aria-hidden={true} />
            {intl.formatMessage({ id: 'dashboard.add_confirm' })}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export const CustomDashboard = connector(Wrapper)
