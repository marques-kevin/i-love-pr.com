import { parseHTML } from 'linkedom'
import { beforeAll, describe, expect, it } from 'vitest'
import { should_play_default_click_sound } from '@/lib/cuelume'

beforeAll(() => {
  const { Element } = parseHTML('<!doctype html><html></html>')
  Object.assign(globalThis, { Element })
})

function el(html: string): Element {
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`)
  const node = document.body.firstElementChild
  if (!node) throw new Error(`Failed to parse: ${html}`)
  return node
}

describe('should_play_default_click_sound', () => {
  it('plays for enabled buttons and links', () => {
    expect(should_play_default_click_sound(el('<button type="button">Save</button>'))).toBe(true)
    expect(should_play_default_click_sound(el('<a href="/repo">Open</a>'))).toBe(true)
  })

  it('plays for roles, toggles, and daisyUI chrome', () => {
    expect(should_play_default_click_sound(el('<div role="button">Action</div>'))).toBe(true)
    expect(should_play_default_click_sound(el('<div role="tab">Overview</div>'))).toBe(true)
    expect(should_play_default_click_sound(el('<div role="menuitem">Delete</div>'))).toBe(true)
    expect(should_play_default_click_sound(el('<input type="checkbox" />'))).toBe(true)
    expect(should_play_default_click_sound(el('<input type="radio" name="x" />'))).toBe(true)
    expect(should_play_default_click_sound(el('<input type="checkbox" class="toggle" />'))).toBe(
      true,
    )
    expect(should_play_default_click_sound(el('<span class="btn">Ghost</span>'))).toBe(true)
    expect(should_play_default_click_sound(el('<a class="tab tab-active">Tab</a>'))).toBe(true)
  })

  it('skips disabled controls and text fields', () => {
    expect(
      should_play_default_click_sound(el('<button type="button" disabled>Save</button>')),
    ).toBe(false)
    expect(
      should_play_default_click_sound(el('<div role="button" aria-disabled="true">X</div>')),
    ).toBe(false)
    expect(should_play_default_click_sound(el('<input type="text" />'))).toBe(false)
    expect(should_play_default_click_sound(el('<textarea />'))).toBe(false)
    expect(
      should_play_default_click_sound(
        el('<fieldset disabled><button type="button">Save</button></fieldset>'),
      ),
    ).toBe(false)
  })

  it('skips opt-out regions, charts, and explicit cuelume attrs', () => {
    expect(
      should_play_default_click_sound(
        el('<div data-cuelume="off"><button type="button">Save</button></div>'),
      ),
    ).toBe(false)
    expect(
      should_play_default_click_sound(
        el('<div class="recharts-wrapper"><button type="button">Point</button></div>'),
      ),
    ).toBe(false)
    expect(
      should_play_default_click_sound(
        el('<button type="button" data-cuelume-press data-cuelume-release>Save</button>'),
      ),
    ).toBe(false)
  })

  it('resolves nested targets to the interactive ancestor', () => {
    const card = el('<a href="/repo"><span class="card"><strong>widgets</strong></span></a>')
    expect(should_play_default_click_sound(card.querySelector('strong'))).toBe(true)
  })

  it('returns false for non-elements', () => {
    expect(should_play_default_click_sound(null)).toBe(false)
  })
})
