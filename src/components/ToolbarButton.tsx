import { ChevronDown } from 'lucide-react'
import { forwardRef } from 'react'

import { cn } from '@/lib/cn'

/** Toolbar chip-button used for "Filter" and "Display". */
export const ToolbarButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }>(function ToolbarButton({ children, active, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 border px-2.5 text-[13px] transition-colors',
        active ? 'border-line-strong bg-surface-2 text-fg' : 'border-line text-muted hover:border-line-strong hover:text-fg',
        rest.className,
      )}
    >
      {children}
      <ChevronDown className="size-3.5 opacity-60" aria-hidden />
    </button>
  )
})
