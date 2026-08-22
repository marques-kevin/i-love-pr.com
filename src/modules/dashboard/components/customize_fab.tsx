import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { Cancel01Icon } from '@/components/icons/cancel_01'
import { Edit02Icon } from '@/components/icons/edit_02'
import { PlusSignIcon } from '@/components/icons/plus_sign'
import { cn } from '@/lib/utils'
import { useDashboardEdit } from './dashboard_edit_context'

const ADD_SPRING = { type: 'spring' as const, stiffness: 420, damping: 28 }
const ICON_CROSSFADE_S = 0.12
const ADD_ENTER_DELAY_S = 0.04

const dock_chip_class = cn(
  'btn btn-xs btn-ghost h-7 min-h-7 gap-1 px-2 whitespace-nowrap',
  'bg-base-200 text-base-content/60 shadow-none',
  '[--radius-field:0]',
)

const dock_icon_btn_class = cn(
  'btn btn-square btn-xs btn-ghost h-7 w-7 min-h-7 p-0',
  'bg-base-200 text-base-content/60 shadow-none',
  '[--radius-field:0] tooltip tooltip-left',
)

export function CustomizeFab() {
  const intl = useIntl()
  const reduce_motion = useReducedMotion() === true
  const { editing, set_editing, open_picker } = useDashboardEdit()

  const customize_label = intl.formatMessage({ id: 'dashboard.customize' })
  const done_label = intl.formatMessage({ id: 'dashboard.done' })
  const add_label = intl.formatMessage({ id: 'dashboard.add_chart' })
  const edit_label = editing ? done_label : customize_label

  const tap_motion = reduce_motion ? undefined : { scale: 0.96 }

  return (
    <div className="absolute right-0 bottom-0 z-20 flex origin-bottom-right items-end">
      <AnimatePresence initial={false}>
        {editing && (
          <motion.button
            type="button"
            className={cn(dock_icon_btn_class, 'rounded-none rounded-tl-md')}
            aria-label={add_label}
            data-tip={add_label}
            onClick={open_picker}
            initial={reduce_motion ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce_motion ? { opacity: 0, scale: 0.85 } : { opacity: 0, scale: 0.85 }}
            transition={
              reduce_motion ? { duration: 0 } : { ...ADD_SPRING, delay: ADD_ENTER_DELAY_S }
            }
            whileTap={tap_motion}
          >
            <HoverIcon icon={PlusSignIcon} size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className={cn(dock_chip_class, editing ? 'rounded-none' : 'rounded-none rounded-tl-md')}
        onClick={() => set_editing((value) => !value)}
        whileTap={tap_motion}
      >
        <span className="relative inline-flex size-4 items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {editing ? (
              <motion.span
                key="done-icon"
                className="absolute inset-0 inline-flex items-center justify-center"
                initial={reduce_motion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce_motion ? undefined : { opacity: 0 }}
                transition={{ duration: reduce_motion ? 0 : ICON_CROSSFADE_S }}
              >
                <HoverIcon icon={Cancel01Icon} size={16} />
              </motion.span>
            ) : (
              <motion.span
                key="edit-icon"
                className="absolute inset-0 inline-flex items-center justify-center"
                initial={reduce_motion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce_motion ? undefined : { opacity: 0 }}
                transition={{ duration: reduce_motion ? 0 : ICON_CROSSFADE_S }}
              >
                <HoverIcon icon={Edit02Icon} size={16} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        {edit_label}
      </motion.button>
    </div>
  )
}
