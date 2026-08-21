import { useState } from 'react'
import { useIntl } from 'react-intl'
import { GithubIcon } from '@/components/icons/github'
import { APP_GITHUB_URL } from '@/lib/app_meta'
import { OnboardingGhostIcons } from './onboarding_ghost_icons'
import { OnboardingHoverIcon } from './onboarding_hover_icon'
import { OnboardingIconGrid } from './onboarding_icon_grid'
import { landing_command_box, landing_hairline } from './onboarding_surface'

interface OnboardingHeroProps {
  on_get_started: () => void
}

export function OnboardingHero({ on_get_started }: OnboardingHeroProps) {
  const intl = useIntl()
  const [ghost_nudged, set_ghost_nudged] = useState(false)

  return (
    <div>
      <div className="relative overflow-hidden">
        <OnboardingGhostIcons layout="field" nudged={ghost_nudged} />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6 sm:pt-16 sm:pb-16 lg:pt-20">
          <h1 className="max-w-3xl font-display text-[clamp(2.6rem,7.5vw,4.25rem)] font-bold tracking-[-0.03em] text-pretty leading-[1.05]">
            <span className="block text-base-content">
              {intl.formatMessage({ id: 'onboarding.hero.headline_lead' })}
            </span>
            <span className="mt-1 block">
              <span className="text-base-content/60">
                {intl.formatMessage({ id: 'onboarding.hero.headline_mid' })}{' '}
              </span>
              <span
                className="cursor-pointer text-heart"
                onPointerEnter={() => set_ghost_nudged(true)}
                onPointerLeave={() => set_ghost_nudged(false)}
              >
                {intl.formatMessage({ id: 'onboarding.hero.headline_accent' })}
              </span>
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-base-content/60 sm:text-lg">
            {intl.formatMessage({ id: 'onboarding.hero.description' })}
          </p>

          <p className="mt-10 text-[11px] font-medium tracking-[0.18em] text-base-content/60 uppercase">
            {intl.formatMessage({ id: 'onboarding.hero.cta_kicker' })}
          </p>
          <div className={`mt-3 w-full max-w-xl ${landing_command_box}`}>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
              onClick={on_get_started}
            >
              <span className="font-mono text-sm text-base-content/60">$</span>
              <span className="truncate text-sm font-medium text-base-content">
                {intl.formatMessage({ id: 'onboarding.hero.cta_start' })}
              </span>
            </button>
            <a
              href={APP_GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className={`m-1.5 inline-flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-base-100 ${landing_hairline}`}
              aria-label={intl.formatMessage({ id: 'onboarding.hero.cta_github' })}
            >
              <OnboardingHoverIcon icon={GithubIcon} size={16} icon_className="text-base-content" />
            </a>
          </div>

          <div className="mt-8">
            <OnboardingGhostIcons layout="strip" nudged={ghost_nudged} />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <OnboardingIconGrid />
      </div>
    </div>
  )
}
