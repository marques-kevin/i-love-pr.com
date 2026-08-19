import { useRef, type ReactNode } from 'react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import type { AnimatedIconHandle } from '@/lib/use_icon_animation'
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

  function play_animation() {
    icon_ref.current?.startAnimation()
  }

  return (
    <div
      className={cn('inline-flex cursor-pointer', className)}
      onMouseEnter={play_animation}
      onPointerEnter={play_animation}
    >
      <Icon
        ref={icon_ref}
        size={size}
        className={cn('pointer-events-none', icon_className)}
        aria-hidden={true}
      />
      {children}
    </div>
  )
}
