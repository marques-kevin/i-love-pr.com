import { useIntl } from 'react-intl'
import { Clock01Icon } from '@/components/ui/clock-01'
import { DashboardSquare01Icon } from '@/components/ui/dashboard-square-01'
import { HistoryIcon } from '@/components/ui/history'
import { RefreshIcon } from '@/components/ui/refresh'
import { Rocket01Icon } from '@/components/ui/rocket-01'
import { Search01Icon } from '@/components/ui/search-01'
import { SparklesIcon } from '@/components/ui/sparkles'
import { UserCheck01Icon } from '@/components/ui/user-check-01'
import type { MessageKey } from '@/lib/i18n/messages/en'
import { OnboardingHoverIcon, type OnboardingAnimatedIcon } from './onboarding_hover_icon'

const HERO_GRID_ITEMS = [
  { key: 'onboarding.hero.grid.cycle_time', icon: Clock01Icon },
  { key: 'onboarding.hero.grid.reviews', icon: UserCheck01Icon },
  { key: 'onboarding.hero.grid.dashboard', icon: DashboardSquare01Icon },
  { key: 'onboarding.hero.grid.sync', icon: RefreshIcon },
  { key: 'onboarding.hero.grid.search', icon: Search01Icon },
  { key: 'onboarding.hero.grid.ship', icon: Rocket01Icon },
  { key: 'onboarding.hero.grid.history', icon: HistoryIcon },
  { key: 'onboarding.hero.grid.insights', icon: SparklesIcon },
] as const satisfies readonly { key: MessageKey; icon: OnboardingAnimatedIcon }[]

export function OnboardingIconGrid() {
  const intl = useIntl()

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {HERO_GRID_ITEMS.map((item) => (
        <li key={item.key} className="min-w-0">
          <OnboardingHoverIcon
            icon={item.icon}
            size={32}
            className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-border/80 bg-background px-2 py-3 text-foreground shadow-sm transition-colors hover:bg-muted/60 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 sm:h-28 lg:aspect-square lg:h-auto"
            icon_className="shrink-0"
          >
            <span className="max-w-full truncate text-center text-[11px] font-medium tracking-wide text-muted-foreground sm:text-xs">
              {intl.formatMessage({ id: item.key })}
            </span>
          </OnboardingHoverIcon>
        </li>
      ))}
    </ul>
  )
}
