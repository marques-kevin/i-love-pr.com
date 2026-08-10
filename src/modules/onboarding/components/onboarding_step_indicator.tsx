import { useIntl } from 'react-intl'
import { cn } from '@/lib/utils'

interface OnboardingStepIndicatorProps {
  current_step: 1 | 2
}

const STEPS = [
  { step: 1 as const, label_id: 'onboarding.step.token' as const },
  { step: 2 as const, label_id: 'onboarding.step.repos' as const },
]

export function OnboardingStepIndicator({ current_step }: OnboardingStepIndicatorProps) {
  const intl = useIntl()

  return (
    <nav aria-label={intl.formatMessage({ id: 'onboarding.steps_label' })} className="mb-8">
      <ol className="flex items-center gap-2">
        {STEPS.map(({ step, label_id }, index) => {
          const is_active = step === current_step
          const is_complete = step < current_step

          return (
            <li key={step} className="flex flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                      is_active && 'bg-primary text-primary-foreground',
                      is_complete && 'bg-primary/20 text-primary',
                      !is_active && !is_complete && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {step}
                  </span>
                  <span
                    className={cn(
                      'truncate text-sm font-medium',
                      is_active ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {intl.formatMessage({ id: label_id })}
                  </span>
                </div>
                <div
                  className={cn(
                    'ml-3.5 h-0.5 rounded-full',
                    is_complete ? 'bg-primary/40' : 'bg-muted',
                  )}
                  aria-hidden
                />
              </div>
              {index < STEPS.length - 1 && (
                <div className="hidden h-px w-4 shrink-0 bg-border sm:block" aria-hidden />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
