import { describe, expect, it } from 'vitest'
import { should_play_default_click_sound, type ClickSoundNode } from './cuelume'

function node(tag_name: string, patch: Partial<ClickSoundNode> = {}): ClickSoundNode {
  return {
    tag_name,
    class_name: '',
    has_href: false,
    input_type: null,
    role: null,
    disabled: false,
    aria_disabled: false,
    cuelume: null,
    ...patch,
  }
}

function should_play(...path: ClickSoundNode[]): boolean {
  return should_play_default_click_sound(path)
}

describe('should_play_default_click_sound', () => {
  it('plays on buttons, links, and daisyUI btn chrome', () => {
    expect(should_play(node('button'))).toBe(true)
    expect(should_play(node('a', { has_href: true }))).toBe(true)
    expect(should_play(node('a', { has_href: true, class_name: 'btn btn-ghost' }))).toBe(true)
    expect(should_play(node('a', { class_name: 'btn' }))).toBe(true)
    expect(should_play(node('div', { class_name: 'btn btn-primary' }))).toBe(true)
  })

  it('plays on interactive roles used by tabs, menus, and switches', () => {
    expect(should_play(node('div', { role: 'button' }))).toBe(true)
    expect(should_play(node('button', { role: 'tab' }))).toBe(true)
    expect(should_play(node('div', { role: 'tab' }))).toBe(true)
    expect(should_play(node('button', { role: 'menuitem' }))).toBe(true)
    expect(should_play(node('div', { role: 'switch' }))).toBe(true)
  })

  it('plays on checkboxes, radios, and daisyUI toggles', () => {
    expect(should_play(node('input', { input_type: 'checkbox' }))).toBe(true)
    expect(should_play(node('input', { input_type: 'radio' }))).toBe(true)
    expect(
      should_play(node('input', { input_type: 'checkbox', class_name: 'toggle toggle-primary' })),
    ).toBe(true)
    expect(should_play(node('div', { class_name: 'toggle' }))).toBe(true)
  })

  it('plays when the event target is inside the interactive control', () => {
    expect(should_play(node('span'), node('button'))).toBe(true)
    expect(should_play(node('p'), node('a', { has_href: true }))).toBe(true)
    expect(should_play(node('svg'), node('button', { role: 'tab' }))).toBe(true)
  })

  it('does not play on disabled or aria-disabled controls', () => {
    expect(should_play(node('button', { disabled: true }))).toBe(false)
    expect(should_play(node('button', { class_name: 'btn', disabled: true }))).toBe(false)
    expect(should_play(node('div', { role: 'button', aria_disabled: true }))).toBe(false)
    expect(should_play(node('input', { input_type: 'checkbox', disabled: true }))).toBe(false)
  })

  it('does not play on data-cuelume=off or anything inside it', () => {
    expect(should_play(node('button', { cuelume: 'off' }))).toBe(false)
    expect(should_play(node('button'), node('div', { cuelume: 'off' }))).toBe(false)
    expect(should_play(node('span'), node('button'), node('section', { cuelume: 'off' }))).toBe(
      false,
    )
  })

  it('does not play while typing or focusing text-like fields', () => {
    expect(should_play(node('input'))).toBe(false)
    expect(should_play(node('input', { input_type: 'text' }))).toBe(false)
    expect(should_play(node('input', { input_type: 'search' }))).toBe(false)
    expect(should_play(node('input', { input_type: 'password' }))).toBe(false)
    expect(should_play(node('input', { input_type: 'email' }))).toBe(false)
    expect(should_play(node('input', { input_type: 'number' }))).toBe(false)
    expect(should_play(node('input', { input_type: 'url' }))).toBe(false)
    expect(should_play(node('textarea'))).toBe(false)
    expect(should_play(node('input', { input_type: 'text', class_name: 'btn' }))).toBe(false)
  })

  it('does not play on chart internals', () => {
    expect(should_play(node('svg'), node('div', { class_name: 'recharts-wrapper' }))).toBe(false)
    expect(should_play(node('button'), node('div', { class_name: 'recharts-wrapper' }))).toBe(false)
  })

  it('lets skip ancestors win over a nested yes-selector', () => {
    expect(should_play(node('button'), node('fieldset', { disabled: true }))).toBe(false)
    expect(
      should_play(node('span'), node('a', { has_href: true }), node('div', { cuelume: 'off' })),
    ).toBe(false)
  })

  it('does not play on inert chrome', () => {
    expect(should_play()).toBe(false)
    expect(should_play(node('div'), node('body'))).toBe(false)
    expect(should_play(node('a'))).toBe(false)
    expect(should_play(node('label'))).toBe(false)
    expect(should_play(node('input', { input_type: 'date' }))).toBe(false)
    expect(should_play(node('div', { class_name: 'btn-ghost' }))).toBe(false)
  })
})
