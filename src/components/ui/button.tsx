import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Button({
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn('btn', className)}
      data-cuelume-press=""
      data-cuelume-release=""
      {...props}
    />
  )
}
