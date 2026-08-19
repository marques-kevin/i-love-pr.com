import type { ComponentType } from 'react'
import { Clock01Icon } from '@/components/ui/clock-01'
import { CloudIcon } from '@/components/ui/cloud'
import { GithubIcon } from '@/components/ui/github'
import { Key01Icon } from '@/components/ui/key-01'
import { LockIcon } from '@/components/ui/lock'
import { Rocket01Icon } from '@/components/ui/rocket-01'
import { Search01Icon } from '@/components/ui/search-01'
import { SparklesIcon } from '@/components/ui/sparkles'
import { cn } from '@/lib/utils'

type GhostIcon = ComponentType<{ size?: number; className?: string }>

const GHOSTS: Array<{
  Icon: GhostIcon
  className: string
  size: number
}> = [
  { Icon: LockIcon, className: 'left-[8%] top-[22%]', size: 44 },
  { Icon: Clock01Icon, className: 'right-[12%] top-[16%]', size: 40 },
  { Icon: Search01Icon, className: 'left-[16%] top-[62%]', size: 36 },
  { Icon: Rocket01Icon, className: 'right-[8%] top-[52%]', size: 42 },
  { Icon: GithubIcon, className: 'left-[44%] top-[10%]', size: 32 },
  { Icon: Key01Icon, className: 'right-[28%] top-[68%]', size: 34 },
  { Icon: CloudIcon, className: 'left-[6%] top-[84%]', size: 38 },
  { Icon: SparklesIcon, className: 'right-[42%] top-[80%]', size: 30 },
]

export function OnboardingGhostIcons() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden text-foreground opacity-[0.07]"
    >
      {GHOSTS.map(({ Icon, className, size }, index) => (
        <div key={index} className={cn('absolute', className)}>
          <Icon size={size} className="text-current" />
        </div>
      ))}
    </div>
  )
}
