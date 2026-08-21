import { has_browser_local_storage } from './boundary_parse'

const THEME_KEY = 'ilovepr.theme'

export const DEFAULT_THEME = 'ilovepr' as const

/** daisyUI built-ins in docs order — not alphabetical. */
export const BUILT_IN_THEMES = [
  'light',
  'dark',
  'cupcake',
  'bumblebee',
  'emerald',
  'corporate',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'black',
  'luxury',
  'dracula',
  'cmyk',
  'autumn',
  'business',
  'acid',
  'lemonade',
  'night',
  'coffee',
  'winter',
  'dim',
  'nord',
  'sunset',
  'caramellatte',
  'abyss',
  'silk',
] as const

export const THEME_NAMES = [DEFAULT_THEME, ...BUILT_IN_THEMES] as const

export type ThemeName = (typeof THEME_NAMES)[number]

export function is_theme_name(value: string): value is ThemeName {
  for (const name of THEME_NAMES) {
    if (name === value) return true
  }
  return false
}

export function normalize_theme(value: string | null | undefined): ThemeName {
  if (value !== null && value !== undefined && is_theme_name(value)) return value
  return DEFAULT_THEME
}

export function get_theme(): ThemeName {
  return normalize_theme(read_stored_theme())
}

export function apply_theme(name: string): ThemeName {
  const theme = normalize_theme(name)
  write_stored_theme(theme)
  set_document_theme(theme)
  return theme
}

/** Call once at app boot — restores the device theme preference. */
export function init_theme(): void {
  apply_theme(get_theme())
}

function read_stored_theme(): string | null {
  if (!has_browser_local_storage()) return null
  try {
    return localStorage.getItem(THEME_KEY)
  } catch {
    return null
  }
}

function write_stored_theme(name: ThemeName): void {
  if (!has_browser_local_storage()) return
  try {
    localStorage.setItem(THEME_KEY, name)
  } catch {
    // private mode / storage blocked
  }
}

function set_document_theme(name: ThemeName): void {
  if (!('document' in globalThis)) return
  globalThis.document.documentElement.dataset.theme = name
}
