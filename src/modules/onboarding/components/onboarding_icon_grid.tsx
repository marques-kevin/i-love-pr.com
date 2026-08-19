import { useIntl } from 'react-intl'
import { Clock01Icon } from '@/components/ui/clock-01'
import { CloudIcon } from '@/components/ui/cloud'
import { DashboardSquare01Icon } from '@/components/ui/dashboard-square-01'
import { Download01Icon } from '@/components/ui/download-01'
import { GithubIcon } from '@/components/ui/github'
import { HistoryIcon } from '@/components/ui/history'
import { Key01Icon } from '@/components/ui/key-01'
import { LockIcon } from '@/components/ui/lock'
import { RefreshIcon } from '@/components/ui/refresh'
import { Rocket01Icon } from '@/components/ui/rocket-01'
import { Search01Icon } from '@/components/ui/search-01'
import { SparklesIcon } from '@/components/ui/sparkles'
import { UserCheck01Icon } from '@/components/ui/user-check-01'
import type { MessageKey } from '@/lib/i18n'
import { OnboardingHoverIcon, type OnboardingAnimatedIcon } from './onboarding_hover_icon'
import { landing_hairline } from './onboarding_surface'

const GALLERY_ITEMS = [
  { key: 'onboarding.hero.pill.local', icon: LockIcon },
  { key: 'onboarding.hero.pill.token', icon: Key01Icon },
  { key: 'onboarding.hero.pill.nobackend', icon: CloudIcon },
  { key: 'onboarding.hero.pill.pwa', icon: Download01Icon },
  { key: 'onboarding.hero.pill.opensource', icon: GithubIcon },
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
  const count = intl.formatMessage(
    { id: 'onboarding.hero.grid.count' },
    { count: GALLERY_ITEMS.length },
  )

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {intl.formatMessage({ id: 'onboarding.hero.grid_title' })}
            </h2>
            <p className="text-sm text-muted-foreground">{count}</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'onboarding.hero.grid.hint' })}
          </p>
        </div>
      </div>
      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8">
        {GALLERY_ITEMS.map((item, index) => (
          <li
            key={item.key}
            className="onboarding-tile-in min-w-0"
            style={{ animationDelay: `${index * 35}ms` }}
          >
            <OnboardingHoverIcon
              icon={item.icon}
              size={32}
              className={`flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl bg-muted px-2 py-3 text-foreground motion-safe:transition-[translate,background-color,box-shadow] motion-safe:hover:-translate-y-0.5 hover:bg-background ${landing_hairline}`}
              icon_className="shrink-0"
            >
              <span className="max-w-full truncate text-center font-mono text-[10px] text-muted-foreground sm:text-[11px]">
                {intl.formatMessage({ id: item.key })}
              </span>
            </OnboardingHoverIcon>
          </li>
        ))}
      </ul>
    </div>
  )
}
