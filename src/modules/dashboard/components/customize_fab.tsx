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

export function CustomizeFab() {
  const intl = useIntl()
  const reduce_motion = useReducedMotion() === true
  const { editing, set_editing, open_picker } = useDashboardEdit()

  const customize_label = intl.formatMessage({ id: 'dashboard.customize' })
  const done_label = intl.formatMessage({ id: 'dashboard.done' })
  const add_label = intl.formatMessage({ id: 'dashboard.add_chart' })

  const hover_motion = reduce_motion ? undefined : { y: -2 }
  const tap_motion = reduce_motion ? undefined : { scale: 0.94 }

  return (
    <div className="absolute right-6 bottom-6 z-20 flex origin-bottom-right flex-row-reverse items-center gap-2">
      <motion.button
        type="button"
        className={cn(
          'btn btn-circle btn-primary size-14 shadow-lg hover:shadow-xl',
          'tooltip tooltip-left',
        )}
        aria-label={editing ? done_label : customize_label}
        data-tip={editing ? done_label : customize_label}
        onClick={() => set_editing((value) => !value)}
        whileHover={hover_motion}
        whileTap={tap_motion}
      >
        <span className="relative inline-flex size-[22px] items-center justify-center">
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
                <HoverIcon icon={Cancel01Icon} size={22} />
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
                <HoverIcon icon={Edit02Icon} size={22} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </motion.button>

      <AnimatePresence initial={false}>
        {editing && (
          <motion.button
            type="button"
            className={cn(
              'btn btn-circle btn-outline bg-base-100 size-12 shadow-lg hover:shadow-xl',
              'tooltip tooltip-left',
            )}
            aria-label={add_label}
            data-tip={add_label}
            onClick={open_picker}
            initial={reduce_motion ? false : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce_motion ? { opacity: 0, scale: 0.5 } : { opacity: 0, scale: 0.5 }}
            transition={
              reduce_motion ? { duration: 0 } : { ...ADD_SPRING, delay: ADD_ENTER_DELAY_S }
            }
            whileHover={hover_motion}
            whileTap={tap_motion}
          >
            <HoverIcon icon={PlusSignIcon} size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
