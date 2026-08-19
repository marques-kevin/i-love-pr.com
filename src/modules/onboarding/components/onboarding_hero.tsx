import { useIntl } from 'react-intl'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { GithubIcon } from '@/components/ui/github'
import { IlovePrLogo } from '@/components/ilove_pr_logo'
import { APP_GITHUB_URL } from '@/lib/app_meta'
import { OnboardingGhostIcons } from './onboarding_ghost_icons'
import { OnboardingHoverIcon } from './onboarding_hover_icon'
import { OnboardingIconGrid } from './onboarding_icon_grid'

interface OnboardingHeroProps {
  on_get_started: () => void
  toolbar?: ReactNode
}

export function OnboardingHero({ on_get_started, toolbar }: OnboardingHeroProps) {
  const intl = useIntl()

  return (
    <section className="bg-background">
      <div className="relative overflow-hidden">
        <OnboardingGhostIcons />

        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <IlovePrLogo className="h-8 w-auto sm:h-9" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-foreground/15 bg-background px-3 shadow-none"
              asChild
            >
              <a href={APP_GITHUB_URL} target="_blank" rel="noreferrer">
                <OnboardingHoverIcon
                  icon={GithubIcon}
                  size={16}
                  className="mr-1.5"
                  icon_className="text-foreground"
                />
                {intl.formatMessage({ id: 'onboarding.hero.cta_github' })}
              </a>
            </Button>
            {toolbar}
          </div>
        </header>

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 pb-10 pt-10 text-center sm:px-6 sm:pb-14 sm:pt-16">
          <h1 className="font-display text-4xl font-bold tracking-tight text-pretty sm:text-5xl lg:text-6xl">
            <span className="block text-foreground">
              {intl.formatMessage({ id: 'onboarding.hero.headline_lead' })}
            </span>
            <span className="mt-1 block">
              <span className="text-muted-foreground">
                {intl.formatMessage({ id: 'onboarding.hero.headline_mid' })}{' '}
              </span>
              <span className="text-[#e5322d]">
                {intl.formatMessage({ id: 'onboarding.hero.headline_accent' })}
              </span>
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            {intl.formatMessage({ id: 'onboarding.hero.description' })}
          </p>

          <p className="mt-10 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {intl.formatMessage({ id: 'onboarding.hero.cta_kicker' })}
          </p>
          <div className="mt-3 flex w-full max-w-xl items-center gap-2 rounded-full border border-border bg-muted/40 p-1.5 pl-2 shadow-none">
            <Button size="lg" className="h-11 flex-1 rounded-full px-6" onClick={on_get_started}>
              {intl.formatMessage({ id: 'onboarding.hero.cta_start' })}
            </Button>
            <Button variant="ghost" size="lg" className="h-11 shrink-0 rounded-full px-5" asChild>
              <a href={APP_GITHUB_URL} target="_blank" rel="noreferrer">
                <OnboardingHoverIcon
                  icon={GithubIcon}
                  size={18}
                  className="mr-2"
                  icon_className="text-foreground"
                />
                {intl.formatMessage({ id: 'onboarding.hero.cta_github' })}
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
        <OnboardingIconGrid />
      </div>
    </section>
  )
}
