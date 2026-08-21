import { describe, expect, it } from 'vitest'
import { dashboard_tab_button_class_name } from './dashboard_tab_styles'

describe('dashboard_tab_button_class_name', () => {
  it('marks active tabs with the concave join class', () => {
    const class_name = dashboard_tab_button_class_name(true)
    expect(class_name).toContain('dashboard-tab--active')
    expect(class_name).toContain('bg-base-100')
  })

  it('uses muted styling for inactive tabs', () => {
    const class_name = dashboard_tab_button_class_name(false)
    expect(class_name).not.toContain('dashboard-tab--active')
    expect(class_name).toContain('text-base-content/60')
  })
})
