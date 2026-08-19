import { useRef, type ReactNode } from 'react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import type { AnimatedIconHandle } from '@/lib/use-icon-animation'
import { cn } from '@/lib/utils'

export type OnboardingAnimatedIcon = ForwardRefExoticComponent<
  {
    size?: number
    className?: string
    'aria-hidden'?: boolean | 'true' | 'false'
  } & RefAttributes<AnimatedIconHandle>
>

export function OnboardingHoverIcon({
  icon: Icon,
  size,
  className,
  icon_className,
  children,
}: {
  icon: OnboardingAnimatedIcon
  size: number
  className?: string
  icon_className?: string
  children?: ReactNode
}) {
  const icon_ref = useRef<AnimatedIconHandle>(null)

  return (
    <div
      className={cn('inline-flex', className)}
      onPointerEnter={() => {
        icon_ref.current?.startAnimation()
      }}
    >
      <Icon ref={icon_ref} size={size} className={icon_className} aria-hidden />
      {children}
    </div>
  )
}
