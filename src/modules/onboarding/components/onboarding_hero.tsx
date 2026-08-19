import { useRef, type ReactNode } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { CloudIcon } from '@/components/ui/cloud'
import { Download01Icon } from '@/components/ui/download-01'
import { GithubIcon } from '@/components/ui/github'
import { Key01Icon } from '@/components/ui/key-01'
import { LockIcon } from '@/components/ui/lock'
import { APP_GITHUB_URL } from '@/lib/app_meta'
import type { AnimatedIconHandle } from '@/lib/use_icon_animation'
import type { MessageKey } from '@/lib/i18n/messages/en'
import { OnboardingHoverIcon, type OnboardingAnimatedIcon } from './onboarding_hover_icon'
import { OnboardingIconGrid } from './onboarding_icon_grid'

const FEATURE_PILLS = [
  { key: 'onboarding.hero.pill.local', icon: LockIcon },
  { key: 'onboarding.hero.pill.nobackend', icon: CloudIcon },
  { key: 'onboarding.hero.pill.token', icon: Key01Icon },
  { key: 'onboarding.hero.pill.pwa', icon: Download01Icon },
  { key: 'onboarding.hero.pill.opensource', icon: GithubIcon },
] as const satisfies readonly { key: MessageKey; icon: OnboardingAnimatedIcon }[]

export function OnboardingHero({
  on_get_started,
  toolbar,
}: {
  on_get_started: () => void
  toolbar?: ReactNode
}) {
  const intl = useIntl()
  const github_icon_ref = useRef<AnimatedIconHandle>(null)

  return (
    <section className="relative flex min-h-[calc(100svh-3rem)] flex-col justify-center overflow-x-hidden px-4 pt-16 pb-16 sm:px-6 sm:pt-14 sm:pb-24">
      {toolbar ? <div className="absolute top-4 right-4 z-10 sm:right-6">{toolbar}</div> : null}
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
        <div className="min-w-0">
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl sm:leading-[0.95] lg:text-7xl">
            {intl.formatMessage(
              { id: 'onboarding.hero.title' },
              {
                accent: (chunks) => (
                  <>
                    <br />
                    <em className="font-accent text-[1.05em] font-normal text-primary italic">
                      {chunks}
                    </em>
                  </>
                ),
              },
            )}
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            {intl.formatMessage({ id: 'onboarding.hero.description' })}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="lg"
              className="h-11 rounded-xl px-5 shadow-sm"
              onClick={on_get_started}
            >
              {intl.formatMessage({ id: 'onboarding.hero.cta_start' })}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 rounded-xl px-5 shadow-sm"
              asChild
            >
              <a
                href={APP_GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                onMouseEnter={() => {
                  github_icon_ref.current?.startAnimation()
                }}
                onPointerEnter={() => {
                  github_icon_ref.current?.startAnimation()
                }}
              >
                <GithubIcon
                  ref={github_icon_ref}
                  size={16}
                  className="inline-flex"
                  aria-hidden={true}
                />
                {intl.formatMessage({ id: 'onboarding.hero.cta_github' })}
              </a>
            </Button>
          </div>

          <ul className="mt-10 flex flex-wrap items-center gap-2">
            {FEATURE_PILLS.map((pill) => (
              <li key={pill.key}>
                <OnboardingHoverIcon
                  icon={pill.icon}
                  size={16}
                  className="items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm"
                >
                  {intl.formatMessage({ id: pill.key })}
                </OnboardingHoverIcon>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          <div className="rounded-3xl border border-border/80 bg-muted/30 p-2 shadow-sm sm:p-3">
            <OnboardingIconGrid />
          </div>
        </div>
      </div>
    </section>
  )
}
