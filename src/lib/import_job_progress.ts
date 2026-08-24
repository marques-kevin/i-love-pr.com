export type ImportJobStep = 'download' | 'prs' | 'facts'

const STEP_RANGE = {
  download: { start: 0, end: 30 },
  prs: { start: 30, end: 80 },
  facts: { start: 80, end: 100 },
} as const satisfies Record<ImportJobStep, { start: number; end: number }>

/** Maps a step plus optional 0–1 fraction into a determinate 0–100 bar. */
export function import_job_percent(step: ImportJobStep, completed_fraction: number | null): number {
  const { start, end } = STEP_RANGE[step]
  if (completed_fraction == null) return start
  const clamped = Math.min(1, Math.max(0, completed_fraction))
  return Math.round(start + (end - start) * clamped)
}

export function should_open_imported_dashboard(pathname: string): boolean {
  return pathname === '/' || pathname === '' || /^\/share\/[^/]+\/?$/.test(pathname)
}

export function navigate_browser_path(path: string): void {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
