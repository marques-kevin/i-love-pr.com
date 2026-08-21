import { describe, expect, it } from 'vitest'
import {
  TAB_CROSSFADE_DURATION_S,
  WINDOW_ENTER_DURATION_S,
  WINDOW_EXIT_DURATION_S,
  dashboard_tab_class_name,
  dashboard_window_motion,
} from './window_chrome'

describe('dashboard_window_motion', () => {
  it('uses opacity only when reduced motion is preferred', () => {
    const variants = dashboard_window_motion(true)

    expect(variants.initial).toEqual({ opacity: 0 })
    expect(variants.animate).toEqual({
      opacity: 1,
      transition: { duration: WINDOW_ENTER_DURATION_S, ease: 'easeOut' },
    })
    expect(variants.exit).toEqual({
      opacity: 0,
      transition: { duration: WINDOW_EXIT_DURATION_S, ease: 'easeOut' },
    })
    expect(variants.initial).not.toHaveProperty('scale')
    expect(variants.initial).not.toHaveProperty('y')
    expect(variants.animate).not.toHaveProperty('scale')
    expect(variants.animate).not.toHaveProperty('y')
    expect(variants.exit).not.toHaveProperty('scale')
    expect(variants.exit).not.toHaveProperty('y')
  })

  it('adds scale and translateY when motion is allowed', () => {
    const variants = dashboard_window_motion(false)

    expect(variants.initial).toEqual({ opacity: 0, scale: 0.97, y: 10 })
    expect(variants.animate).toEqual({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: WINDOW_ENTER_DURATION_S, ease: 'easeOut' },
    })
    expect(variants.exit).toEqual({
      opacity: 0,
      scale: 0.97,
      y: 10,
      transition: { duration: WINDOW_EXIT_DURATION_S, ease: 'easeOut' },
    })
  })
})

describe('dashboard_tab_class_name', () => {
  it('builds the active tab with body fill and concave-join class', () => {
    const class_name = dashboard_tab_class_name(true)

    expect(class_name).toContain('dashboard-chrome-tab')
    expect(class_name).toContain('dashboard-chrome-tab--active')
    expect(class_name).toContain('bg-base-100')
    expect(class_name).not.toContain('hover:bg-base-300/40')
  })

  it('builds inactive tabs without fill and with hover chrome', () => {
    const class_name = dashboard_tab_class_name(false)

    expect(class_name).toContain('dashboard-chrome-tab')
    expect(class_name).not.toContain('dashboard-chrome-tab--active')
    expect(class_name).toContain('text-base-content/60')
    expect(class_name).toContain('hover:bg-base-300/40')
    expect(class_name).toContain('rounded-t-xl')
    expect(class_name).not.toContain('bg-base-100')
  })

  it('keeps the tab crossfade duration at 150ms', () => {
    expect(TAB_CROSSFADE_DURATION_S).toBe(0.15)
  })
})
