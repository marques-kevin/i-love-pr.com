import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  apply_theme,
  BUILT_IN_THEMES,
  DEFAULT_THEME,
  get_theme,
  init_theme,
  normalize_theme,
  THEME_NAMES,
} from '@/lib/theme'

const DAISYUI_DOCS_ORDER = [
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

type ThemeDataset = {
  theme?: string
}

function stub_storage_and_document() {
  const store = new Map<string, string>()
  const dataset: ThemeDataset = {}
  vi.stubGlobal('localStorage', {
    getItem(key: string): string | null {
      return store.get(key) ?? null
    },
    setItem(key: string, value: string): void {
      store.set(key, value)
    },
  })
  vi.stubGlobal('document', {
    documentElement: { dataset },
  })
  return { store, dataset }
}

describe('THEME_NAMES', () => {
  it('puts ilovepr first, then the 35 daisyUI built-ins in docs order', () => {
    expect(THEME_NAMES).toHaveLength(36)
    expect(THEME_NAMES[0]).toBe(DEFAULT_THEME)
    expect(BUILT_IN_THEMES).toEqual(DAISYUI_DOCS_ORDER)
    expect([...THEME_NAMES.slice(1)]).toEqual([...BUILT_IN_THEMES])
  })
})

describe('normalize_theme', () => {
  it('keeps allowlisted names', () => {
    expect(normalize_theme('ilovepr')).toBe('ilovepr')
    expect(normalize_theme('synthwave')).toBe('synthwave')
    expect(normalize_theme('silk')).toBe('silk')
  })

  it('falls back to ilovepr for unknown or empty values', () => {
    expect(normalize_theme(undefined)).toBe('ilovepr')
    expect(normalize_theme(null)).toBe('ilovepr')
    expect(normalize_theme('')).toBe('ilovepr')
    expect(normalize_theme('not-a-theme')).toBe('ilovepr')
    expect(normalize_theme('Light')).toBe('ilovepr')
  })
})

describe('get_theme', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns ilovepr when localStorage is missing', () => {
    expect(get_theme()).toBe('ilovepr')
  })

  it('returns a stored allowlisted theme', () => {
    const { store } = stub_storage_and_document()
    store.set('ilovepr.theme', 'dracula')
    expect(get_theme()).toBe('dracula')
  })

  it('falls back to ilovepr when the stored value is unknown', () => {
    const { store } = stub_storage_and_document()
    store.set('ilovepr.theme', 'magenta')
    expect(get_theme()).toBe('ilovepr')
  })
})

describe('apply_theme', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('persists an allowlisted theme and sets data-theme', () => {
    const { store, dataset } = stub_storage_and_document()
    expect(apply_theme('cyberpunk')).toBe('cyberpunk')
    expect(store.get('ilovepr.theme')).toBe('cyberpunk')
    expect(dataset.theme).toBe('cyberpunk')
  })

  it('does not persist an unknown value', () => {
    const { store, dataset } = stub_storage_and_document()
    expect(apply_theme('nope')).toBe('ilovepr')
    expect(store.get('ilovepr.theme')).toBe('ilovepr')
    expect(dataset.theme).toBe('ilovepr')
  })
})

describe('init_theme', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('restores the stored theme on boot', () => {
    const { store, dataset } = stub_storage_and_document()
    store.set('ilovepr.theme', 'forest')
    init_theme()
    expect(dataset.theme).toBe('forest')
  })

  it('rewrites an invalid stored value to ilovepr', () => {
    const { store, dataset } = stub_storage_and_document()
    store.set('ilovepr.theme', 'unknown')
    init_theme()
    expect(store.get('ilovepr.theme')).toBe('ilovepr')
    expect(dataset.theme).toBe('ilovepr')
  })
})
