import type { StatusId } from '@/data'
import { STATUSES } from '@/data'
import { cn } from '@/lib/cn'

export const STATUS_COLOR: Record<StatusId, string> = {
  backlog: 'var(--c-backlog)',
  todo: 'var(--c-todo)',
  in_progress: 'var(--c-progress)',
  in_review: 'var(--c-review)',
  blocked: 'var(--c-blocked)',
  done: 'var(--c-done)',
  canceled: 'var(--c-canceled)',
}

export const statusName = (s: StatusId) => STATUSES.find((x) => x.id === s)?.name ?? s

/**
 * The reference's status square: a hairline square with a coloured core.
 * Backlog is dashed, in-progress fills half, done carries a tick, canceled a cross.
 */
export function StatusIcon({ status, size = 14, className }: { status: StatusId; size?: number; className?: string }) {
  const c = STATUS_COLOR[status]
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" className={cn('shrink-0', className)} role="img" aria-label={statusName(status)}>
      <rect
        x="0.75"
        y="0.75"
        width="12.5"
        height="12.5"
        fill="none"
        stroke={status === 'backlog' ? c : 'var(--c-line-strong)'}
        strokeDasharray={status === 'backlog' ? '2 2' : undefined}
        strokeWidth="1.2"
      />
      {status === 'todo' && <rect x="4.5" y="4.5" width="5" height="5" fill={c} />}
      {status === 'in_progress' && (
        <>
          <rect x="4" y="4" width="6" height="6" fill="none" stroke={c} strokeWidth="1.2" />
          <rect x="4" y="7" width="6" height="3" fill={c} />
        </>
      )}
      {status === 'in_review' && <rect x="4" y="4" width="6" height="6" fill={c} />}
      {status === 'blocked' && <rect x="4" y="4" width="6" height="6" fill={c} />}
      {status === 'done' && (
        <>
          <rect x="2.5" y="2.5" width="9" height="9" fill={c} />
          <path d="M4.6 7.1l1.6 1.6 3.3-3.4" fill="none" stroke="var(--c-bg)" strokeWidth="1.4" />
        </>
      )}
      {status === 'canceled' && <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke={c} strokeWidth="1.3" />}
    </svg>
  )
}
