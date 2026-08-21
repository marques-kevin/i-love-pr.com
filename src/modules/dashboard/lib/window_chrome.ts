export const WINDOW_ENTER_DURATION_S = 0.28
export const WINDOW_EXIT_DURATION_S = 0.18
export const TAB_CROSSFADE_DURATION_S = 0.15

const EASE_OUT = 'easeOut'

export type WindowMotionTransition = {
  duration: number
  ease: typeof EASE_OUT
}

export type WindowMotionTarget = {
  opacity: number
  scale?: number
  y?: number
  transition?: WindowMotionTransition
}

export type WindowMotionVariants = {
  initial: WindowMotionTarget
  animate: WindowMotionTarget
  exit: WindowMotionTarget
}

function ease_out_transition(duration: number): WindowMotionTransition {
  return { duration, ease: EASE_OUT }
}

export function dashboard_window_motion(reduce_motion: boolean): WindowMotionVariants {
  const enter = ease_out_transition(WINDOW_ENTER_DURATION_S)
  const exit = ease_out_transition(WINDOW_EXIT_DURATION_S)

  if (reduce_motion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: enter },
      exit: { opacity: 0, transition: exit },
    }
  }

  return {
    initial: { opacity: 0, scale: 0.97, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0, transition: enter },
    exit: { opacity: 0, scale: 0.97, y: 10, transition: exit },
  }
}

export function dashboard_tab_class_name(is_active: boolean): string {
  const base = 'dashboard-chrome-tab group relative flex min-w-0 items-stretch text-sm font-medium'

  if (is_active) {
    return `${base} dashboard-chrome-tab--active bg-base-100 text-base-content`
  }

  return `${base} rounded-t-xl text-base-content/60 hover:bg-base-300/40`
}
