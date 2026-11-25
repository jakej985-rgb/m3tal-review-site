import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

/** Hairline chip with a colour square; used for labels, cycles and filter tokens. */
/** `color` draws a swatch; `icon` replaces it with any glyph (status, avatar…). */
export function LabelChip({ color, icon, children, onRemove, className }: { color?: string; icon?: ReactNode; children: ReactNode; onRemove?: () => void; className?: string }) {
  return (
    <span className={cn('inline-flex h-[22px] max-w-full items-center gap-1.5 border border-line px-1.5 text-xs text-muted', className)}>
      {icon ?? (color && <span className="size-2 shrink-0" style={{ background: color }} aria-hidden />)}
      <span className="truncate">{children}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="hit -mr-1.5 inline-flex h-full w-6 items-center justify-center text-muted hover:bg-surface-2 hover:text-fg" aria-label={`Remove ${typeof children === 'string' ? children : 'filter'}`}>
          <X className="size-3" aria-hidden />
        </button>
      )}
    </span>
  )
}

/** Small uppercase mono badge (counts, versions, "New"). */
export function Badge({ children, tone = 'default', className }: { children: ReactNode; tone?: 'default' | 'solid' | 'accent'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center px-1.5 font-mono text-[11px] leading-none',
        tone === 'default' && 'border border-line text-muted',
        tone === 'solid' && 'bg-invert text-invert-fg',
        tone === 'accent' && 'border border-progress/50 text-progress',
        className,
      )}
    >
      {children}
    </span>
  )
}
