import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { Cancel01Icon } from '@/components/icons/cancel_01'
import { Edit02Icon } from '@/components/icons/edit_02'
import { PlusSignIcon } from '@/components/icons/plus_sign'
import { cn } from '@/lib/utils'

const SPRING = { type: 'spring' as const, stiffness: 420, damping: 28 }
const ICON_CROSSFADE_S = 0.12
const ADD_ENTER_DELAY_S = 0.04

type CustomizeFabProps = {
  editing: boolean
  on_toggle: () => void
  on_add: () => void
}

function FabButton({
  className,
  tooltip,
  aria_label,
  onClick,
  children,
  reduce_motion,
}: {
  className: string
  tooltip: string
  aria_label: string
  onClick: () => void
  children: ReactNode
  reduce_motion: boolean
}) {
  return (
    <motion.button
      type="button"
      className={cn('tooltip tooltip-left btn btn-circle shadow-lg hover:shadow-xl', className)}
      data-tip={tooltip}
      aria-label={aria_label}
      onClick={onClick}
      whileHover={reduce_motion ? undefined : { y: -2 }}
      whileTap={reduce_motion ? undefined : { scale: 0.94 }}
    >
      {children}
    </motion.button>
  )
}

export function CustomizeFab({ editing, on_toggle, on_add }: CustomizeFabProps) {
  const intl = useIntl()
  const reduce_motion = useReducedMotion() === true

  const customize_label = intl.formatMessage({ id: 'dashboard.customize' })
  const done_label = intl.formatMessage({ id: 'dashboard.done' })
  const add_label = intl.formatMessage({ id: 'dashboard.add_chart' })

  const icon_transition = reduce_motion ? { duration: 0 } : { duration: ICON_CROSSFADE_S }

  const add_initial = reduce_motion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }
  const add_animate = reduce_motion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, transition: { ...SPRING, delay: ADD_ENTER_DELAY_S } }
  const add_exit = reduce_motion ? { opacity: 0 } : { opacity: 0, scale: 0.5, transition: SPRING }

  return (
    <div className="absolute bottom-6 right-6 z-20">
      <div
        className={cn(editing && 'flex origin-bottom-right flex-row-reverse items-center gap-2')}
      >
        <FabButton
          className="btn-primary size-14"
          tooltip={editing ? done_label : customize_label}
          aria_label={editing ? done_label : customize_label}
          onClick={on_toggle}
          reduce_motion={reduce_motion}
        >
          <AnimatePresence mode="wait" initial={false}>
            {editing ? (
              <motion.span
                key="cancel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={icon_transition}
                className="inline-flex"
              >
                <HoverIcon icon={Cancel01Icon} size={22} />
              </motion.span>
            ) : (
              <motion.span
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={icon_transition}
                className="inline-flex"
              >
                <HoverIcon icon={Edit02Icon} size={22} />
              </motion.span>
            )}
          </AnimatePresence>
        </FabButton>

        <AnimatePresence>
          {editing && (
            <motion.div
              key="add-fab"
              initial={add_initial}
              animate={add_animate}
              exit={add_exit}
              className="inline-flex"
            >
              <FabButton
                className="btn-outline bg-base-100 size-12"
                tooltip={add_label}
                aria_label={add_label}
                onClick={on_add}
                reduce_motion={reduce_motion}
              >
                <HoverIcon icon={PlusSignIcon} size={20} />
              </FabButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
