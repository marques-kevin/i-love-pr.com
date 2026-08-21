import type { Transition, Variants } from 'motion/react'

const WINDOW_ENTER_MS = 0.28
const WINDOW_EXIT_MS = 0.18
const TAB_CROSSFADE_MS = 0.15

export function dashboard_window_variants(reduce_motion: boolean): Variants {
  if (reduce_motion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    }
  }

  return {
    initial: { opacity: 0, scale: 0.97, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.97, y: 10 },
  }
}

export function dashboard_window_transition(
  phase: 'enter' | 'exit',
  reduce_motion: boolean,
): Transition {
  if (reduce_motion) {
    return {
      duration: phase === 'enter' ? WINDOW_ENTER_MS : WINDOW_EXIT_MS,
      ease: 'easeOut',
    }
  }

  return {
    duration: phase === 'enter' ? WINDOW_ENTER_MS : WINDOW_EXIT_MS,
    ease: 'easeOut',
  }
}

export function dashboard_body_variants(): Variants {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  }
}

export function dashboard_body_transition(): Transition {
  return {
    duration: TAB_CROSSFADE_MS,
    ease: 'easeOut',
  }
}
