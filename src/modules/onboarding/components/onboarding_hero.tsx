import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { GitHubMark } from '@/components/github_mark'
import { APP_GITHUB_URL } from '@/lib/app_meta'
import { IlovePrLogo } from '@/components/ilove_pr_logo'
import type { MessageKey } from '@/lib/i18n/messages/en'

const FEATURE_PILL_KEYS = [
  'onboarding.hero.pill.local',
  'onboarding.hero.pill.nobackend',
  'onboarding.hero.pill.token',
  'onboarding.hero.pill.pwa',
  'onboarding.hero.pill.opensource',
] as const satisfies readonly MessageKey[]

export function OnboardingHero({ on_get_started }: { on_get_started: () => void }) {
  const intl = useIntl()

  return (
    <section className="relative overflow-hidden px-6 pt-14 pb-16 sm:pt-20 sm:pb-20">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <IlovePrLogo className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both h-16 w-auto duration-500 sm:h-20" />

        <h1 className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both mt-5 max-w-2xl font-display text-4xl font-extrabold tracking-tight text-balance text-foreground duration-700 delay-75 sm:text-5xl sm:leading-[1.1]">
          {intl.formatMessage(
            { id: 'onboarding.hero.title' },
            {
              accent: (chunks) => (
                <em className="font-accent text-[1.05em] font-normal text-primary italic">
                  {chunks}
                </em>
              ),
            },
          )}
        </h1>

        <p className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both mt-5 max-w-xl text-base leading-relaxed text-muted-foreground duration-700 delay-150 sm:text-lg">
          {intl.formatMessage({ id: 'onboarding.hero.description' })}
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both mt-8 flex flex-wrap items-center justify-center gap-3 delay-200 duration-700">
          <Button
            type="button"
            size="lg"
            className="h-10 rounded-xl px-5 shadow-sm"
            onClick={on_get_started}
          >
            {intl.formatMessage({ id: 'onboarding.hero.cta_start' })}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-10 rounded-xl px-5 shadow-sm"
            asChild
          >
            <a href={APP_GITHUB_URL} target="_blank" rel="noreferrer">
              <GitHubMark className="size-4" />
              {intl.formatMessage({ id: 'onboarding.hero.cta_github' })}
            </a>
          </Button>
        </div>

        <div className="animate-in fade-in fill-mode-both relative mt-14 w-full max-w-2xl delay-300 duration-1000">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent sm:w-16" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent sm:w-16" />
          <ul className="flex flex-wrap items-center justify-center gap-2">
            {FEATURE_PILL_KEYS.map((key) => (
              <li
                key={key}
                className="rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm"
              >
                {intl.formatMessage({ id: key })}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
