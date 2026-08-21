/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest'
import { should_play_default_click_sound } from './cuelume'

function click_target(html: string, selector: string): EventTarget {
  document.body.innerHTML = html
  const element = document.querySelector(selector)
  if (!element) throw new Error(`missing selector: ${selector}`)
  return element
}

describe('should_play_default_click_sound', () => {
  it('plays for enabled buttons and daisyUI btn links', () => {
    expect(
      should_play_default_click_sound(
        click_target('<button type="button">Save</button>', 'button'),
      ),
    ).toBe(true)
    expect(
      should_play_default_click_sound(
        click_target('<a href="/settings" class="btn btn-primary">Settings</a>', 'a'),
      ),
    ).toBe(true)
    expect(should_play_default_click_sound(click_target('<a class="btn">Action</a>', 'a'))).toBe(
      true,
    )
  })

  it('plays for roles, toggles, and form controls', () => {
    expect(
      should_play_default_click_sound(
        click_target('<div role="tab" tabindex="0">Overview</div>', '[role="tab"]'),
      ),
    ).toBe(true)
    expect(
      should_play_default_click_sound(
        click_target('<div role="menuitem" tabindex="0">Delete</div>', '[role="menuitem"]'),
      ),
    ).toBe(true)
    expect(
      should_play_default_click_sound(
        click_target('<input type="checkbox" class="toggle" />', 'input'),
      ),
    ).toBe(true)
    expect(
      should_play_default_click_sound(click_target('<input type="radio" name="x" />', 'input')),
    ).toBe(true)
    expect(
      should_play_default_click_sound(
        click_target('<label class="toggle"><input type="checkbox" /></label>', 'label'),
      ),
    ).toBe(true)
  })

  it('does not play for disabled or aria-disabled controls', () => {
    expect(
      should_play_default_click_sound(
        click_target('<button type="button" disabled>Save</button>', 'button'),
      ),
    ).toBe(false)
    expect(
      should_play_default_click_sound(
        click_target('<a href="/x" class="btn" aria-disabled="true">Blocked</a>', 'a'),
      ),
    ).toBe(false)
    expect(
      should_play_default_click_sound(
        click_target('<fieldset disabled><button type="button">Save</button></fieldset>', 'button'),
      ),
    ).toBe(false)
  })

  it('does not play inside opt-out, chart, or text-entry zones', () => {
    expect(
      should_play_default_click_sound(
        click_target('<div data-cuelume="off"><button type="button">Drag</button></div>', 'button'),
      ),
    ).toBe(false)
    expect(
      should_play_default_click_sound(
        click_target(
          '<div class="recharts-wrapper"><button type="button">Point</button></div>',
          'button',
        ),
      ),
    ).toBe(false)
    expect(
      should_play_default_click_sound(click_target('<input type="text" value="hello" />', 'input')),
    ).toBe(false)
    expect(
      should_play_default_click_sound(click_target('<textarea>notes</textarea>', 'textarea')),
    ).toBe(false)
  })

  it('does not play for plain anchors without href or non-interactive elements', () => {
    expect(should_play_default_click_sound(click_target('<a>Plain link</a>', 'a'))).toBe(false)
    expect(
      should_play_default_click_sound(click_target('<div class="card">Static</div>', 'div')),
    ).toBe(false)
    expect(should_play_default_click_sound(null)).toBe(false)
  })

  it('lets skip zones win over nested interactive chrome', () => {
    expect(
      should_play_default_click_sound(
        click_target(
          '<div data-cuelume="off"><a href="/x" class="btn">Inside opt-out</a></div>',
          'a',
        ),
      ),
    ).toBe(false)
    expect(
      should_play_default_click_sound(
        click_target(
          '<div class="recharts-wrapper"><span><button type="button">Zoom</button></span></div>',
          'button',
        ),
      ),
    ).toBe(false)
  })
})
