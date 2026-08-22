export const CHART_BAR_RADIUS = 2
export const CHART_VERTICAL_BAR_RADIUS: [number, number, number, number] = [2, 2, 0, 0]
export const CHART_STRIPPED_BODY_INSET = 3
export const CHART_STRIPPED_CAP_SIZE = 2
export const CHART_STRIPPED_CAP_OFFSET = 4
export const CHART_STRIPPED_BODY_OPACITY = 0.2
export const CHART_STRIPPED_CAP_RADIUS = 1
export const CHART_GRID_STROKE = 'color-mix(in oklab, var(--color-base-content) 15%, transparent)'
export const CHART_TOOLTIP_DURATION_MS = 200
export const CHART_INTRO_DURATION_MS = 400
export const CHART_LINE_ACTIVE_DOT = { r: 3, strokeWidth: 0 } as const
export const CHART_TOOLTIP_SURFACE_CLASS =
  'rounded-lg border border-base-content/10 bg-base-100 px-2.5 py-1.5 text-xs shadow-xl duration-200'

export type ChartBarLayout = 'vertical' | 'horizontal'
export type ChartBarVariant = 'default' | 'stripped'
export type ChartGridLayout = 'vertical' | 'horizontal' | 'both'

export type BarPaintBox = {
  x: number
  y: number
  width: number
  height: number
}

export type ChartGridLines = {
  vertical: boolean
  horizontal: boolean
}

export type MediaQueryMatch = {
  matches: boolean
}

export function chart_grid_lines(layout: ChartGridLayout): ChartGridLines {
  if (layout === 'horizontal') return { vertical: true, horizontal: false }
  if (layout === 'both') return { vertical: true, horizontal: true }
  return { vertical: false, horizontal: true }
}

export function chart_bar_color(key: string): string {
  return `var(--color-${key})`
}

export function chart_bar_fill(key: string): string {
  return chart_bar_color(key)
}

export function is_gradient_paint(fill: string): boolean {
  return fill.startsWith('url(') || fill.startsWith('var(--fill-')
}

export function resolve_stripped_fill(
  series_key: string | undefined,
  fill: string | undefined,
): string | undefined {
  if (series_key) return chart_bar_color(series_key)
  if (fill === undefined || is_gradient_paint(fill)) return undefined
  return fill
}

export function stripped_bar_body(box: BarPaintBox, layout: ChartBarLayout): BarPaintBox {
  if (layout === 'horizontal') {
    return {
      x: box.x,
      y: box.y,
      width: Math.max(0, box.width - CHART_STRIPPED_BODY_INSET),
      height: box.height,
    }
  }
  return {
    x: box.x,
    y: box.y,
    width: box.width,
    height: Math.max(0, box.height - CHART_STRIPPED_BODY_INSET),
  }
}

export function stripped_bar_cap(box: BarPaintBox, layout: ChartBarLayout): BarPaintBox {
  if (layout === 'horizontal') {
    return {
      x: box.x + box.width + CHART_STRIPPED_CAP_OFFSET - CHART_STRIPPED_CAP_SIZE,
      y: box.y,
      width: CHART_STRIPPED_CAP_SIZE,
      height: box.height,
    }
  }
  return {
    x: box.x,
    y: box.y - CHART_STRIPPED_CAP_OFFSET,
    width: box.width,
    height: CHART_STRIPPED_CAP_SIZE,
  }
}

export function stripped_bar_body_radius(
  radius: number,
  layout: ChartBarLayout,
): [number, number, number, number] {
  if (layout === 'horizontal') return [0, radius, radius, 0]
  return [radius, radius, 0, 0]
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
