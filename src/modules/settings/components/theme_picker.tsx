import { useState } from 'react'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { ChevronDownIcon } from '@/components/icons/chevron_down'
import { Tick02Icon } from '@/components/icons/tick_02'
import { Button } from '@/components/ui/button'
import { close_daisy_dropdown } from '@/lib/daisy'
import { apply_theme, BUILT_IN_THEMES, DEFAULT_THEME, get_theme, type ThemeName } from '@/lib/theme'

function ThemeSwatch() {
  return (
    <span className="flex shrink-0 items-center gap-0.5" aria-hidden="true">
      <span className="size-3 rounded-full bg-base-100 ring-1 ring-base-content/20" />
      <span className="size-3 rounded-full bg-primary" />
      <span className="size-3 rounded-full bg-secondary" />
      <span className="size-3 rounded-full bg-accent" />
    </span>
  )
}

function ThemeOption({
  name,
  selected,
  show_default_badge,
  on_pick,
}: {
  name: ThemeName
  selected: boolean
  show_default_badge: boolean
  on_pick: (name: ThemeName, node: EventTarget) => void
}) {
  const intl = useIntl()

  return (
    <Button
      type="button"
      role="radio"
      aria-checked={selected}
      data-theme={name}
      className="btn-ghost btn-sm w-full justify-start gap-2 font-normal"
      onClick={(event) => on_pick(name, event.currentTarget)}
    >
      <ThemeSwatch />
      <span className="min-w-0 flex-1 truncate text-left">{name}</span>
      {show_default_badge ? (
        <span className="badge badge-ghost badge-xs">
          {intl.formatMessage({ id: 'settings.theme_default' })}
        </span>
      ) : null}
      {selected ? <HoverIcon icon={Tick02Icon} size={16} /> : null}
    </Button>
  )
}

export function ThemePicker() {
  const intl = useIntl()
  const [theme, set_theme] = useState(get_theme)

  function pick_theme(name: ThemeName, node: EventTarget) {
    set_theme(apply_theme(name))
    close_daisy_dropdown(node)
  }

  return (
    <div className="dropdown dropdown-bottom w-full">
      <Button
        type="button"
        tabIndex={0}
        className="btn-outline w-full justify-between font-normal"
        aria-haspopup="true"
        aria-label={intl.formatMessage({ id: 'settings.theme_select' }, { name: theme })}
      >
        <span className="flex min-w-0 items-center gap-2">
          <ThemeSwatch />
          <span className="truncate">{theme}</span>
        </span>
        <HoverIcon icon={ChevronDownIcon} size={16} icon_className="opacity-60" />
      </Button>
      <div
        tabIndex={-1}
        role="radiogroup"
        aria-label={intl.formatMessage({ id: 'settings.theme_options' })}
        className="dropdown-content bg-base-100 rounded-box z-50 w-full max-h-72 overflow-y-auto p-1.5 shadow-lg ring-1 ring-base-content/10"
      >
        <ThemeOption
          name={DEFAULT_THEME}
          selected={theme === DEFAULT_THEME}
          show_default_badge={true}
          on_pick={pick_theme}
        />
        <div className="divider my-1.5" />
        <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
          {BUILT_IN_THEMES.map((name) => (
            <ThemeOption
              key={name}
              name={name}
              selected={theme === name}
              show_default_badge={false}
              on_pick={pick_theme}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
