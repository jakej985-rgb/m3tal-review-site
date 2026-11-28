import type { PriorityId } from '@/data'
import { PRIORITIES } from '@/data'
import { cn } from '@/lib/cn'

export const PRIORITY_COLOR: Record<PriorityId, string> = {
  1: 'var(--c-blocked)',
  2: 'var(--c-progress)',
  3: 'var(--c-todo)',
  4: 'var(--c-backlog)',
  0: 'var(--c-line-strong)',
}

export const priorityName = (p: PriorityId) => PRIORITIES.find((x) => x.id === p)?.name ?? ''

/** `dot` is the reference's coloured dot; `bars` is the denser in-app glyph. */
export function PriorityIcon({ priority, variant = 'bars', className }: { priority: PriorityId; variant?: 'dot' | 'bars'; className?: string }) {
  const c = PRIORITY_COLOR[priority]
  const label = priorityName(priority)
  if (variant === 'dot') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" className={cn('shrink-0', className)} role="img" aria-label={label}>
        {priority === 0 ? <circle cx="6" cy="6" r="4.5" fill="none" stroke={c} strokeDasharray="2 1.6" /> : <circle cx="6" cy="6" r="5" fill={c} />}
      </svg>
    )
  }
  if (priority === 1) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className={cn('shrink-0', className)} role="img" aria-label={label}>
        <rect x="0.5" y="0.5" width="13" height="13" fill={c} />
        <rect x="6.2" y="3" width="1.6" height="5" fill="var(--c-bg)" />
        <rect x="6.2" y="9.4" width="1.6" height="1.6" fill="var(--c-bg)" />
      </svg>
    )
  }
  if (priority === 0) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className={cn('shrink-0', className)} role="img" aria-label={label}>
        {[2, 6, 10].map((x) => (
          <rect key={x} x={x - 0.5} y="6.3" width="2" height="1.4" fill="var(--c-faint)" />
        ))}
      </svg>
    )
  }
  const filled = 5 - priority // high 3, medium 2, low 1
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={cn('shrink-0', className)} role="img" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={1 + i * 4.5} y={9 - i * 3.5} width="3" height={4 + i * 3.5} fill={i < filled ? 'var(--c-fg)' : 'var(--c-line-strong)'} />
      ))}
    </svg>
  )
}
