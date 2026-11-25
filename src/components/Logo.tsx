import { BRAND } from '@/data'
import { cn } from '@/lib/cn'

/** The stacked-bars mark from the reference, plus the wordmark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className ?? 'size-5'} aria-hidden fill="currentColor">
      <rect x="2" y="3" width="16" height="3.4" />
      <rect x="6" y="8.3" width="12" height="3.4" />
      <rect x="2" y="13.6" width="16" height="3.4" />
    </svg>
  )
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-fg', className)}>
      <LogoMark />
      {!compact && <span className="text-[17px] font-semibold tracking-[0.07em] uppercase">{BRAND.name}</span>}
    </span>
  )
}
