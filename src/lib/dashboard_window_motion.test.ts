import { describe, expect, it } from 'vitest'
import {
  dashboard_body_transition,
  dashboard_window_transition,
  dashboard_window_variants,
} from './dashboard_window_motion'

describe('dashboard_window_variants', () => {
  it('uses opacity only when reduced motion is preferred', () => {
    const variants = dashboard_window_variants(true)
    expect(variants.initial).toEqual({ opacity: 0 })
    expect(variants.animate).toEqual({ opacity: 1 })
    expect(variants.exit).toEqual({ opacity: 0 })
  })

  it('includes scale and translate when motion is allowed', () => {
    const variants = dashboard_window_variants(false)
    expect(variants.initial).toMatchObject({ opacity: 0, scale: 0.97, y: 10 })
    expect(variants.animate).toMatchObject({ opacity: 1, scale: 1, y: 0 })
    expect(variants.exit).toMatchObject({ opacity: 0, scale: 0.97, y: 10 })
  })
})

describe('dashboard_window_transition', () => {
  it('uses shorter duration on exit', () => {
    expect(dashboard_window_transition('enter', false).duration).toBe(0.28)
    expect(dashboard_window_transition('exit', false).duration).toBe(0.18)
  })
})

describe('dashboard_body_transition', () => {
  it('crossfades tab content in 150ms', () => {
    expect(dashboard_body_transition().duration).toBe(0.15)
  })
})
