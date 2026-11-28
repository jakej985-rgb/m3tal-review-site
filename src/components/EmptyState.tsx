import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

/** Hatched square + title + body + optional action. */
export function EmptyState({ title, body, action, className }: { title: string; body?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="hatch-strong mb-5 size-14 border border-line-strong" aria-hidden />
      <p className="text-[15px] font-medium text-fg">{title}</p>
      {body && <p className="mt-1.5 max-w-xs text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
