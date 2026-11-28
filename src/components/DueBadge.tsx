import { Calendar } from 'lucide-react'

import { cn } from '@/lib/cn'
import { dueTone, shortDate } from '@/lib/dates'

const TONE = {
  overdue: 'text-blocked',
  soon: 'text-progress',
  later: 'text-muted',
  none: 'text-faint',
} as const

export function DueBadge({ due, className }: { due: string | null; className?: string }) {
  if (!due) return null
  const tone = dueTone(due)
  return (
    <span className={cn('inline-flex items-center gap-1 font-mono text-[11px] whitespace-nowrap', TONE[tone], className)} title={tone === 'overdue' ? 'Overdue' : 'Due date'}>
      <Calendar className="size-3" strokeWidth={1.8} aria-hidden />
      {shortDate(due)}
    </span>
  )
}
