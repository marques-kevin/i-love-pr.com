import { has_browser_navigator } from '@/lib/boundary_parse'

export function build_import_link_from_param(raw_param: string): string {
  const trimmed = raw_param.trim()
  if (trimmed.includes('://')) return trimmed
  if (!has_browser_navigator()) return trimmed
  return `${window.location.origin}/?import=${encodeURIComponent(trimmed)}`
}

/** Read `?import=` / `?share=` on `/`, strip params from the URL, return a prefilled link. */
export function consume_home_import_url_param(): string | null {
  if (!has_browser_navigator()) return null
  if (window.location.pathname !== '/') return null

  const params = new URLSearchParams(window.location.search)
  const import_param = params.get('import') ?? params.get('share')
  if (!import_param?.trim()) return null

  const prefill = build_import_link_from_param(import_param)
  params.delete('import')
  params.delete('share')
  const next_search = params.toString()
  const next_url = `${window.location.pathname}${next_search ? `?${next_search}` : ''}${window.location.hash}`
  window.history.replaceState({}, '', next_url)
  return prefill
}
