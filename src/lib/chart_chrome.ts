export const CHART_BAR_RADIUS = 2
export const CHART_VERTICAL_BAR_RADIUS: [number, number, number, number] = [2, 2, 0, 0]
export const CHART_GRID_STROKE = 'color-mix(in oklab, var(--color-base-content) 15%, transparent)'
export const CHART_TOOLTIP_DURATION_MS = 200
export const CHART_INTRO_DURATION_MS = 400
export const CHART_BAR_GRADIENT_END_OPACITY = 0.55
export const CHART_LINE_ACTIVE_DOT = { r: 3, strokeWidth: 0 } as const
export const CHART_TOOLTIP_SURFACE_CLASS =
  'rounded-lg border border-base-content/10 bg-base-100 px-2.5 py-1.5 text-xs shadow-xl duration-200'

export type ChartGridLayout = 'vertical' | 'horizontal' | 'both'

export type ChartGridLines = {
  vertical: boolean
  horizontal: boolean
}

export type ChartGradientAxis = {
  x1: string
  y1: string
  x2: string
  y2: string
}

export type ChartGradientStop = {
  offset: string
  color: string
  opacity: number
}

export type MediaQueryMatch = {
  matches: boolean
}

export function chart_grid_lines(layout: ChartGridLayout): ChartGridLines {
  if (layout === 'horizontal') return { vertical: true, horizontal: false }
  if (layout === 'both') return { vertical: true, horizontal: true }
  return { vertical: false, horizontal: true }
}

export function chart_bar_gradient_id(chart_id: string, key: string): string {
  return `${chart_id}-bar-${key}`
}

export function chart_bar_fill(key: string): string {
  return `var(--fill-${key})`
}

export function chart_gradient_axis(layout: 'vertical' | 'horizontal'): ChartGradientAxis {
  if (layout === 'horizontal') {
    return { x1: '0', y1: '0', x2: '1', y2: '0' }
  }
  return { x1: '0', y1: '0', x2: '0', y2: '1' }
}

export function chart_bar_gradient_stops(
  color: string,
  end_opacity = CHART_BAR_GRADIENT_END_OPACITY,
): ChartGradientStop[] {
  return [
    { offset: '0%', color, opacity: 1 },
    { offset: '100%', color, opacity: end_opacity },
  ]
}

export function prefers_reduced_motion(media: MediaQueryMatch | null | undefined): boolean {
  return media?.matches === true
}

export function chart_animation_active(reduce_motion: boolean): boolean {
  return !reduce_motion
}

function has_browser_match_media(): boolean {
  // SAFETY: Workers lib has no DOM matchMedia; optional presence is checked without assuming the DOM type.
  return (globalThis as { matchMedia?: unknown }).matchMedia !== undefined
}

export function chart_is_animation_active(): boolean {
  if (!has_browser_match_media()) return false
  // SAFETY: has_browser_match_media confirmed matchMedia exists on this globalThis.
  const match_media = (globalThis as { matchMedia: (query: string) => MediaQueryMatch }).matchMedia
  return chart_animation_active(
    prefers_reduced_motion(match_media('(prefers-reduced-motion: reduce)')),
  )
}
