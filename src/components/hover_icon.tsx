import { useLayoutEffect, useRef, type ReactNode } from 'react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import type { AnimatedIconHandle } from '@/lib/use_icon_animation'
import { cn } from '@/lib/utils'

const CONTROL_SELECTOR = 'button, a, [role="button"], [role="menuitem"], summary, .btn'

export type AnimatedIcon = ForwardRefExoticComponent<
  {
    size?: number
    className?: string
    'aria-hidden'?: boolean | 'true' | 'false'
  } & RefAttributes<AnimatedIconHandle>
>

export function HoverIcon({
  icon: Icon,
  size,
  className,
  icon_className,
  children,
}: {
  icon: AnimatedIcon
  size: number
  className?: string
  icon_className?: string
  children?: ReactNode
}) {
  const icon_ref = useRef<AnimatedIconHandle>(null)
  const wrapper_ref = useRef<HTMLDivElement>(null)
  const uses_wrapper_hover = children != null

  function play_animation() {
    icon_ref.current?.startAnimation()
  }

  function stop_animation() {
    icon_ref.current?.stopAnimation()
  }

  useLayoutEffect(() => {
    if (uses_wrapper_hover) return

    const wrapper = wrapper_ref.current
    if (!wrapper) return

    const target = wrapper.closest(CONTROL_SELECTOR) ?? wrapper

    function on_enter() {
      icon_ref.current?.startAnimation()
    }

    function on_leave() {
      icon_ref.current?.stopAnimation()
    }

    target.addEventListener('mouseenter', on_enter)
    target.addEventListener('pointerenter', on_enter)
    target.addEventListener('mouseleave', on_leave)
    target.addEventListener('pointerleave', on_leave)

    return () => {
      target.removeEventListener('mouseenter', on_enter)
      target.removeEventListener('pointerenter', on_enter)
      target.removeEventListener('mouseleave', on_leave)
      target.removeEventListener('pointerleave', on_leave)
    }
  }, [uses_wrapper_hover])

  return (
    <div
      ref={wrapper_ref}
      className={cn('inline-flex shrink-0', uses_wrapper_hover && 'cursor-pointer', className)}
      onMouseEnter={uses_wrapper_hover ? play_animation : undefined}
      onPointerEnter={uses_wrapper_hover ? play_animation : undefined}
      onMouseLeave={uses_wrapper_hover ? stop_animation : undefined}
      onPointerLeave={uses_wrapper_hover ? stop_animation : undefined}
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
