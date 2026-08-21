import { bind, play, setEnabled, setVolume, type SoundName } from 'cuelume'
import { has_browser_document, has_browser_local_storage } from './boundary_parse'

const SOUND_ENABLED_KEY = 'ilovepr.sound_enabled'

const TEXT_LIKE_INPUT_TYPES = new Set(['', 'text', 'search', 'password', 'email', 'number', 'url'])
const INTERACTIVE_ROLES = new Set(['button', 'tab', 'menuitem', 'switch'])

const DEFAULT_CLICK_SOUND_EVENTS = ['pointerdown', 'pointerup', 'pointercancel'] as const

let default_click_sounds_bound = false

export type ClickSoundNode = {
  tag_name: string
  class_name: string
  has_href: boolean
  input_type: string | null
  role: string | null
  disabled: boolean
  aria_disabled: boolean
  cuelume: string | null
}

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

/**
 * Path from the event target to the root. Skip ancestors win over a nested
 * interactive control (`data-cuelume="off"`, charts, disabled fieldset).
 */
export function should_play_default_click_sound(path: readonly ClickSoundNode[]): boolean {
  for (const node of path) {
    if (is_default_click_sound_skip(node)) return false
  }
  for (const node of path) {
    if (is_default_click_sound_target(node)) return true
  }
  return false
}

function is_default_click_sound_skip(node: ClickSoundNode): boolean {
  if (node.cuelume === 'off') return true
  if (node.disabled || node.aria_disabled) return true
  if (has_class_token(node.class_name, 'recharts-wrapper')) return true
  if (node.tag_name === 'textarea') return true
  if (node.tag_name === 'input' && TEXT_LIKE_INPUT_TYPES.has(normalize_token(node.input_type))) {
    return true
  }
  return false
}

function is_default_click_sound_target(node: ClickSoundNode): boolean {
  if (node.tag_name === 'button') return true
  if (node.tag_name === 'a' && node.has_href) return true
  if (node.role !== null && INTERACTIVE_ROLES.has(normalize_token(node.role))) return true
  if (node.tag_name === 'input') {
    const input_type = normalize_token(node.input_type)
    if (input_type === 'checkbox' || input_type === 'radio') return true
  }
  return has_class_token(node.class_name, 'toggle') || has_class_token(node.class_name, 'btn')
}

function bind_default_click_sounds(): void {
  if (!has_browser_document() || default_click_sounds_bound) return
  default_click_sounds_bound = true
  for (const type of DEFAULT_CLICK_SOUND_EVENTS) {
    document.addEventListener(type, on_default_click_pointer, true)
  }
}

function on_default_click_pointer(event: Event): void {
  if (!should_play_default_click_sound(click_sound_path_from_event_target(event.target))) return
  if (event.type === 'pointerdown') {
    play('press')
    return
  }
  play('release')
}

function click_sound_path_from_event_target(target: EventTarget | null): ClickSoundNode[] {
  let element: Element | null = null
  if (target instanceof Element) {
    element = target
  } else if (target instanceof Node) {
    element = target.parentElement
  }
  if (!element) return []

  const path: ClickSoundNode[] = []
  let current: Element | null = element
  while (current) {
    path.push(click_sound_node_from_element(current))
    current = current.parentElement
  }
  return path
}

function click_sound_node_from_element(element: Element): ClickSoundNode {
  return {
    tag_name: element.tagName.toLowerCase(),
    class_name: element.getAttribute('class') ?? '',
    has_href: element.hasAttribute('href'),
    input_type: element.getAttribute('type'),
    role: element.getAttribute('role'),
    disabled: element.hasAttribute('disabled'),
    aria_disabled: element.getAttribute('aria-disabled') === 'true',
    cuelume: element.getAttribute('data-cuelume'),
  }
}

function has_class_token(class_name: string, token: string): boolean {
  for (const item of class_name.split(/\s+/)) {
    if (item === token) return true
  }
  return false
}

function normalize_token(value: string | null): string {
  if (value === null) return ''
  return value.trim().toLowerCase()
}
