import { bind, play, setEnabled, setVolume, type SoundName } from 'cuelume'
import { has_browser_local_storage } from './boundary_parse'

const SOUND_ENABLED_KEY = 'ilovepr.sound_enabled'

const INTERACTIVE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  '[role="button"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="switch"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  '.toggle',
  '.btn',
  '.tab',
].join(', ')

const SKIP_ANCESTOR_SELECTOR = ['[data-cuelume="off"]', '.recharts-wrapper'].join(', ')

const TEXT_INPUT_SELECTOR = [
  'input:not([type])',
  'input[type="text"]',
  'input[type="search"]',
  'input[type="password"]',
  'input[type="email"]',
  'input[type="number"]',
  'input[type="url"]',
  'textarea',
].join(', ')

let default_click_sound_bound = false

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

function is_dom_element(target: EventTarget | null): target is Element {
  if (target === null) return false
  // SAFETY: Element may be absent in non-DOM runtimes; only real DOM pointer targets reach this helper in production.
  const ElementCtor = (globalThis as { Element?: typeof Element }).Element
  if (ElementCtor === undefined) return false
  return target instanceof ElementCtor
}

export function should_play_default_click_sound(target: EventTarget | null): boolean {
  if (!is_dom_element(target)) return false
  if (target.closest(SKIP_ANCESTOR_SELECTOR)) return false

  const interactive = target.closest(INTERACTIVE_SELECTOR)
  if (!interactive) return false

  if (interactive.matches('[disabled], [aria-disabled="true"]')) return false
  if (interactive.matches(TEXT_INPUT_SELECTOR)) return false

  const disabled_fieldset = interactive.closest('fieldset[disabled]')
  if (disabled_fieldset?.contains(interactive)) return false

  if (
    interactive.hasAttribute('data-cuelume-press') ||
    interactive.hasAttribute('data-cuelume-release')
  ) {
    return false
  }

  return true
}

function bind_default_click_sound(): void {
  // SAFETY: document is absent in non-DOM runtimes; listener registration runs only in the browser boot path.
  if ((globalThis as { document?: unknown }).document === undefined || default_click_sound_bound)
    return
  default_click_sound_bound = true

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!should_play_default_click_sound(event.target)) return
      play('press')
    },
    true,
  )

  const on_pointer_up = (event: PointerEvent) => {
    if (!should_play_default_click_sound(event.target)) return
    play('release')
  }

  document.addEventListener('pointerup', on_pointer_up, true)
  document.addEventListener('pointercancel', on_pointer_up, true)
}

/** Call once at app boot — safe to run before first user gesture. */
export function init_cuelume(): void {
  setVolume(0.55)
  setEnabled(is_sound_enabled())
  bind()
  bind_default_click_sound()
}

export function play_sound(name: SoundName, options?: { volume?: number }): void {
  play(name, options)
}
