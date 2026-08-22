import { describe, expect, it } from 'vitest'
import {
  CHART_BAR_GRADIENT_END_OPACITY,
  CHART_BAR_RADIUS,
  CHART_INTRO_DURATION_MS,
  CHART_STRIPPED_BODY_INSET,
  CHART_STRIPPED_CAP_OFFSET,
  CHART_STRIPPED_CAP_SIZE,
  CHART_TOOLTIP_DURATION_MS,
  CHART_VERTICAL_BAR_RADIUS,
  chart_animation_active,
  chart_bar_color,
  chart_bar_fill,
  chart_bar_gradient_id,
  chart_bar_gradient_stops,
  chart_gradient_axis,
  chart_grid_lines,
  prefers_reduced_motion,
  stripped_bar_body,
  stripped_bar_body_radius,
  stripped_bar_cap,
} from './chart_chrome'

describe('chart_grid_lines', () => {
  it('shows value-axis lines only for vertical category charts', () => {
    expect(chart_grid_lines('vertical')).toEqual({ vertical: false, horizontal: true })
  })

  it('shows value-axis lines only for horizontal ranking charts', () => {
    expect(chart_grid_lines('horizontal')).toEqual({ vertical: true, horizontal: false })
  })

  it('shows both axes when both are value axes', () => {
    expect(chart_grid_lines('both')).toEqual({ vertical: true, horizontal: true })
  })
})

describe('chart bar recipe', () => {
  it('keeps a 2px radius, top-only on vertical bars', () => {
    expect(CHART_BAR_RADIUS).toBe(2)
    expect(CHART_VERTICAL_BAR_RADIUS).toEqual([2, 2, 0, 0])
  })

  it('builds gradient ids and CSS fill vars from the series key', () => {
    expect(chart_bar_gradient_id('chart-abc', 'count')).toBe('chart-abc-bar-count')
    expect(chart_bar_fill('count')).toBe('var(--fill-count)')
    expect(chart_bar_color('count')).toBe('var(--color-count)')
  })

  it('shrinks the painted body and floats a solid cap at the value end', () => {
    const box = { x: 10, y: 20, width: 16, height: 40 }
    expect(stripped_bar_body(box, 'vertical')).toEqual({
      x: 10,
      y: 20,
      width: 16,
      height: 40 - CHART_STRIPPED_BODY_INSET,
    })
    expect(stripped_bar_cap(box, 'vertical')).toEqual({
      x: 10,
      y: 20 - CHART_STRIPPED_CAP_OFFSET,
      width: 16,
      height: CHART_STRIPPED_CAP_SIZE,
    })
    expect(stripped_bar_body(box, 'horizontal')).toEqual({
      x: 10,
      y: 20,
      width: 16 - CHART_STRIPPED_BODY_INSET,
      height: 40,
    })
    expect(stripped_bar_cap(box, 'horizontal')).toEqual({
      x: 10 + 16 + CHART_STRIPPED_CAP_OFFSET - CHART_STRIPPED_CAP_SIZE,
      y: 20,
      width: CHART_STRIPPED_CAP_SIZE,
      height: 40,
    })
    expect(stripped_bar_body_radius(CHART_BAR_RADIUS, 'vertical')).toEqual([2, 2, 0, 0])
    expect(stripped_bar_body_radius(CHART_BAR_RADIUS, 'horizontal')).toEqual([0, 2, 2, 0])
  })

  it('fades the existing series color top to bottom', () => {
    expect(chart_gradient_axis('vertical')).toEqual({ x1: '0', y1: '0', x2: '0', y2: '1' })
    expect(chart_gradient_axis('horizontal')).toEqual({ x1: '0', y1: '0', x2: '1', y2: '0' })
    expect(chart_bar_gradient_stops('var(--color-count)')).toEqual([
      { offset: '0%', color: 'var(--color-count)', opacity: 1 },
      { offset: '100%', color: 'var(--color-count)', opacity: CHART_BAR_GRADIENT_END_OPACITY },
    ])
  })
})

describe('prefers_reduced_motion', () => {
  it('is false when matchMedia is missing or does not match', () => {
    expect(prefers_reduced_motion(undefined)).toBe(false)
    expect(prefers_reduced_motion(null)).toBe(false)
    expect(prefers_reduced_motion({ matches: false })).toBe(false)
  })

  it('is true only when the reduce-motion query matches', () => {
    expect(prefers_reduced_motion({ matches: true })).toBe(true)
  })
})

describe('chart_animation_active', () => {
  it('disables Recharts intro animation when motion is reduced', () => {
    expect(chart_animation_active(true)).toBe(false)
    expect(chart_animation_active(false)).toBe(true)
  })

  it('keeps intro and tooltip timings cheap', () => {
    expect(CHART_INTRO_DURATION_MS).toBe(400)
    expect(CHART_TOOLTIP_DURATION_MS).toBe(200)
  })
})
