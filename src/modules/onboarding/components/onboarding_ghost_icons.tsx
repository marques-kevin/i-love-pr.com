import type { ComponentType } from 'react'
import { useReducedMotion } from 'motion/react'
import { AlertCircleIcon } from '@/components/ui/alert-circle'
import { Clock01Icon } from '@/components/ui/clock-01'
import { CloudIcon } from '@/components/ui/cloud'
import { DashboardSquare01Icon } from '@/components/ui/dashboard-square-01'
import { Download01Icon } from '@/components/ui/download-01'
import { GithubIcon } from '@/components/ui/github'
import { HistoryIcon } from '@/components/ui/history'
import { Key01Icon } from '@/components/ui/key-01'
import { LockIcon } from '@/components/ui/lock'
import { MinusSignCircleIcon } from '@/components/ui/minus-sign-circle'
import { RefreshIcon } from '@/components/ui/refresh'
import { Rocket01Icon } from '@/components/ui/rocket-01'
import { Search01Icon } from '@/components/ui/search-01'
import { SparklesIcon } from '@/components/ui/sparkles'
import { Tick02Icon } from '@/components/ui/tick-02'
import { UserCheck01Icon } from '@/components/ui/user-check-01'
import { cn } from '@/lib/utils'

type GhostIcon = ComponentType<{ size?: number; className?: string }>

const GHOSTS: Array<{
  Icon: GhostIcon
  left: string
  top: string
  rotate: number
  strip: boolean
}> = [
  { Icon: LockIcon, left: '62%', top: '6%', rotate: -14, strip: true },
  { Icon: Clock01Icon, left: '78%', top: '2%', rotate: 8, strip: false },
  { Icon: Search01Icon, left: '88%', top: '18%', rotate: -6, strip: false },
  { Icon: Rocket01Icon, left: '70%', top: '22%', rotate: 12, strip: true },
  { Icon: GithubIcon, left: '92%', top: '8%', rotate: -10, strip: false },
  { Icon: Key01Icon, left: '54%', top: '28%', rotate: 16, strip: false },
  { Icon: CloudIcon, left: '82%', top: '34%', rotate: 7, strip: false },
  { Icon: SparklesIcon, left: '64%', top: '40%', rotate: -18, strip: false },
  { Icon: DashboardSquare01Icon, left: '94%', top: '42%', rotate: 5, strip: false },
  { Icon: Download01Icon, left: '48%', top: '48%', rotate: -8, strip: false },
  { Icon: HistoryIcon, left: '76%', top: '52%', rotate: 11, strip: false },
  { Icon: RefreshIcon, left: '8%', top: '58%', rotate: -12, strip: false },
  { Icon: Tick02Icon, left: '28%', top: '62%', rotate: 9, strip: false },
  { Icon: UserCheck01Icon, left: '58%', top: '66%', rotate: -7, strip: true },
  { Icon: AlertCircleIcon, left: '86%', top: '68%', rotate: 14, strip: false },
  { Icon: MinusSignCircleIcon, left: '14%', top: '78%', rotate: -15, strip: false },
  { Icon: Clock01Icon, left: '40%', top: '82%', rotate: 10, strip: false },
  { Icon: Rocket01Icon, left: '72%', top: '86%', rotate: -11, strip: false },
]

function nudge_offset(index: number, enabled: boolean): string {
  if (!enabled) return 'translate(0px, 0px)'
  const x = ((index % 5) - 2) * 5
  const y = (index % 3) * -4 - 2
  return `translate(${x}px, ${y}px)`
}

export function OnboardingGhostIcons({
  nudged,
  layout,
}: {
  nudged: boolean
  layout: 'field' | 'strip'
}) {
  const reduce_motion = useReducedMotion()
  const active = nudged && !reduce_motion
  const items = layout === 'strip' ? GHOSTS.filter((ghost) => ghost.strip) : GHOSTS

  if (layout === 'strip') {
    return (
      <div
        aria-hidden
        className="flex items-center justify-start gap-8 py-2 text-foreground opacity-[0.22] sm:hidden"
      >
        {items.map(({ Icon, rotate }, index) => (
          <div
            key={index}
            className="transition-transform duration-500 ease-out"
            style={{
              transform: `${nudge_offset(index, active)} rotate(${rotate + (active ? 6 : 0)}deg)`,
            }}
          >
            <Icon size={40} className="text-current" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden overflow-hidden text-foreground opacity-[0.22] sm:block"
    >
      {items.map(({ Icon, left, top, rotate }, index) => (
        <div
          key={index}
          className={cn(
            'absolute transition-transform duration-500 ease-out',
            reduce_motion && 'transition-none',
          )}
          style={{
            left,
            top,
            transform: `${nudge_offset(index, active)} rotate(${rotate + (active ? 5 : 0)}deg)`,
          }}
        >
          <Icon size={52} className="text-current" />
        </div>
      ))}
    </div>
  )
}
