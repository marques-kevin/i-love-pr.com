import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { ArrowDown02Icon } from '@/components/icons/arrow_down_02'
import { ArrowUp02Icon } from '@/components/icons/arrow_up_02'
import { Delete02Icon } from '@/components/icons/delete_02'
import { PlusSignIcon } from '@/components/icons/plus_sign'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { DashboardLayoutItem, DashboardWidgetId } from '@/lib/types'
import { create_layout_item } from '@/lib/dashboard_layout'
import { imported_repo_chrome } from '@/lib/imported_repo'
import { widget_description_key, widget_label_key } from '@/lib/i18n'
import { DASHBOARD_WIDGET_CATALOG, get_dashboard_widget_meta } from '../lib/widget_catalog'
import { useDashboardEdit } from './dashboard_edit_context'
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

export function Wrapper({ layout, is_imported, save_layout }: ConnectorProps) {
  const intl = useIntl()
  const chrome = imported_repo_chrome(is_imported)
  const {
    editing,
    set_editing,
    picker_open,
    set_picker_open,
    preview_widget_id,
    set_preview_widget_id,
    open_picker,
  } = useDashboardEdit()

  const add_widget = (widget_id: DashboardWidgetId) => {
    if (!chrome.show_customize) return
    save_layout([...layout, create_layout_item(widget_id)])
    set_picker_open(false)
  }

  const remove_widget = (instance_id: string) => {
    if (!chrome.show_customize) return
    save_layout(layout.filter((item) => item.instance_id !== instance_id))
  }

  return (
    <>
      {layout.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">
            {intl.formatMessage({ id: 'dashboard.empty_title' })}
          </p>
          <p className="text-base-content/60 mt-2 text-sm">
            {intl.formatMessage({ id: 'dashboard.empty_body' })}
          </p>
          {chrome.show_customize ? (
            <Button
              type="button"
              className="btn-primary mt-6"
              onClick={() => {
                set_editing(true)
                open_picker()
              }}
            >
              <HoverIcon icon={PlusSignIcon} size={16} />
              {intl.formatMessage({ id: 'dashboard.add_chart' })}
            </Button>
          ) : null}
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
                        <HoverIcon icon={ArrowUp02Icon} size={16} />
                      </Button>
                      <Button
                        type="button"
                        className="btn-ghost btn-square btn-xs"
                        disabled={index === layout.length - 1}
                        onClick={() => save_layout(move_item(layout, item.instance_id, 1))}
                        aria-label={intl.formatMessage({ id: 'dashboard.move_down' })}
                      >
                        <HoverIcon icon={ArrowDown02Icon} size={16} />
                      </Button>
                      <Button
                        type="button"
                        className="btn-ghost btn-square btn-xs"
                        onClick={() => remove_widget(item.instance_id)}
                        aria-label={intl.formatMessage({ id: 'dashboard.remove' }, { label })}
                      >
                        <HoverIcon icon={Delete02Icon} size={16} />
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
        open={picker_open && chrome.show_customize}
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

        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[minmax(14rem,18rem)_1fr]">
          <div className="min-h-0 max-h-[40vh] overflow-y-auto overscroll-contain md:h-full md:max-h-none">
            <ul className="menu w-full rounded-none border-b border-base-300 p-3 md:border-r md:border-b-0">
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
          </div>

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
            <HoverIcon icon={PlusSignIcon} size={16} />
            {intl.formatMessage({ id: 'dashboard.add_confirm' })}
          </Button>
        </div>
      </Modal>
    </>
  )
}

export const CustomDashboard = connector(Wrapper)
