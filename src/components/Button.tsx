import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { Link } from '@/lib/router'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  // The reference's light-grey square CTA.
  primary: 'bg-invert text-invert-fg hover:bg-invert/88 active:bg-invert/80 border border-invert',
  // The outlined "Sign up".
  outline: 'border border-line-strong text-fg hover:bg-surface-2 hover:border-muted/60 active:bg-raised',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2 active:bg-raised border border-transparent',
  danger: 'border border-danger/50 text-danger hover:bg-danger/10 active:bg-danger/15',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-[13px] gap-1.5 pointer-coarse:h-10',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-[52px] px-7 text-[17px] gap-3',
}

const BASE =
  'group/btn relative inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px ' +
  'disabled:opacity-45 disabled:active:translate-y-0'

/** The class string for a button look, for links and other elements that should match. */
export const buttonClass = (variant: ButtonVariant = 'outline', size: ButtonSize = 'md', className?: string) => cn(BASE, VARIANTS[variant], SIZES[size], className)

/** A router link that looks like a Button. */
export function ButtonLink({ to, variant, size, className, children, iconRight, ...rest }: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string; variant?: ButtonVariant; size?: ButtonSize; iconRight?: ReactNode }) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)} {...rest}>
      {children}
      {iconRight && <span className="transition-transform duration-200 ease-out group-hover/btn:translate-x-0.5">{iconRight}</span>}
    </Link>
  )
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'outline', size = 'md', loading, icon, iconRight, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
      {iconRight && <span className="transition-transform duration-200 ease-out group-hover/btn:translate-x-0.5">{iconRight}</span>}
    </button>
  )
})
