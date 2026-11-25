import { motion } from 'motion/react'
import { type ReactNode, useId } from 'react'

import { cn } from '@/lib/cn'

type Option<T extends string> = { value: T; label: ReactNode; icon?: ReactNode }

/** Hairline segmented control with a sliding thumb. Arrow keys move between options. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'sm',
  className,
}: {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const id = useId()
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex border border-line p-0.5', className)}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
        e.preventDefault()
        const i = options.findIndex((o) => o.value === value)
        const next = options[(i + (e.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length]
        onChange(next.value)
        ;(e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus()
      }}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            data-value={o.value}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative inline-flex items-center gap-1.5 font-medium transition-colors duration-150',
              size === 'sm' ? 'h-7 px-2.5 text-[13px] pointer-coarse:h-10 pointer-coarse:min-w-10 justify-center' : 'h-9 px-3.5 text-sm',
              on ? 'text-fg' : 'text-muted hover:text-fg',
            )}
          >
            {on && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 bg-surface-2 ring-1 ring-line-strong" transition={{ type: 'spring', stiffness: 600, damping: 40 }} />}
            <span className="relative inline-flex items-center gap-1.5">
              {o.icon}
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
