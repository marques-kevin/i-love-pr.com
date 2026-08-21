import { bind, play, setEnabled, setVolume, type SoundName } from 'cuelume'
import { has_browser_local_storage } from './boundary_parse'

const SOUND_ENABLED_KEY = 'ilovepr.sound_enabled'

function has_browser_document(): boolean {
  // SAFETY: Workers lib has no DOM Document; optional presence is checked without assuming the DOM type.
  return (globalThis as { document?: unknown }).document !== undefined
}

const TEXT_INPUT_SELECTOR =
  'input:not([type]), input[type="text"], input[type="search"], input[type="password"], input[type="email"], input[type="number"], input[type="url"]'

const SKIP_ZONE_SELECTORS = [
  '[data-cuelume="off"]',
  '.recharts-wrapper',
  'textarea',
  TEXT_INPUT_SELECTOR,
].join(', ')

const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  '[role="button"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="switch"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  '.toggle',
  '.btn',
].join(', ')

export function is_sound_enabled(): boolean {
  if (!has_browser_local_storage()) return true
  const raw = localStorage.getItem(SOUND_ENABLED_KEY)
  if (raw == null) return true
  return raw === '1' || raw === 'true'
}

export function set_sound_enabled(enabled: boolean): void {
  if (has_browser_local_storage()) {
    localStorage.setItem(SOUND_ENABLED_KEY, enabled ? '1' : '0')
  }
  setEnabled(enabled)
}

/** Pure matcher for the document-level default click sound layer. */
export function should_play_default_click_sound(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false

  if (target.closest(SKIP_ZONE_SELECTORS)) return false

  const interactive = target.closest(INTERACTIVE_SELECTOR)
  if (!interactive) return false

  if (interactive.matches('[disabled], [aria-disabled="true"]')) return false
  if (interactive.closest('fieldset[disabled]')) return false

  return true
}

let default_click_sounds_bound = false

function bind_default_click_sounds(): void {
  if (default_click_sounds_bound || !has_browser_document()) return
  default_click_sounds_bound = true

  const on_pointer_down = (event: PointerEvent) => {
    if (should_play_default_click_sound(event.target)) {
      play('press')
    }
  }

  const on_pointer_up = (event: PointerEvent) => {
    if (should_play_default_click_sound(event.target)) {
      play('release')
    }
  }

  document.addEventListener('pointerdown', on_pointer_down, { capture: true })
  document.addEventListener('pointerup', on_pointer_up, { capture: true })
  document.addEventListener('pointercancel', on_pointer_up, { capture: true })
}

/** Call once at app boot — safe to run before first user gesture. */
export function init_cuelume(): void {
  setVolume(0.55)
  setEnabled(is_sound_enabled())
  bind()
  bind_default_click_sounds()
}

export function play_sound(name: SoundName, options?: { volume?: number }): void {
  play(name, options)
}
