import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
  size?: 'sm' | 'md'
  active?: boolean
}

/** Square icon-only button. `label` is required: it becomes the accessible name and tooltip. */
export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { label, children, size = 'md', active, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center text-muted transition-colors duration-150',
        'hover:bg-surface-2 hover:text-fg active:bg-raised disabled:opacity-40',
        active && 'bg-surface-2 text-fg',
        size === 'sm' ? 'size-7 pointer-coarse:size-10' : 'size-10',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
