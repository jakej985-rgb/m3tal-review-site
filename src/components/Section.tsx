import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

/** Landing section heading: mono eyebrow, tight headline, grey body. */
export function SectionHead({ eyebrow, title, body, className, children }: { eyebrow: string; title: string; body?: string; className?: string; children?: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-3xl">
        <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">{eyebrow}</p>
        <h2 className="mt-4 text-[34px] leading-[1.05] font-semibold tracking-[-0.035em] text-balance md:text-[44px]">{title}</h2>
        {body && <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted">{body}</p>}
      </div>
      {children}
    </div>
  )
}

/** The hairline box the whole UI is built from. Pass `title` (and `actions`) for a header bar. */
export function Panel({ children, className, as: As = 'div', title, actions, bodyClassName }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article'; title?: string; actions?: ReactNode; bodyClassName?: string }) {
  if (!title) return <As className={cn('border border-line bg-surface', className)}>{children}</As>
  return (
    <As className={cn('flex min-w-0 flex-col border border-line bg-surface', className)} aria-label={As === 'section' ? title : undefined}>
      <header className="flex min-h-12 flex-wrap items-center gap-3 border-b border-line px-5 py-2">
        <h2 className="text-sm font-medium">{title}</h2>
        {actions && <div className="ml-auto flex items-center gap-3">{actions}</div>}
      </header>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </As>
  )
}

/** Big number with label and a mono footnote. Lay several in a hairline grid. */
export function StatTile({ label, value, sub, className }: { label: string; value: ReactNode; sub?: string; className?: string }) {
  return (
    <div className={cn('border-r border-b border-line p-5', className)}>
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-3 text-[34px] leading-none font-semibold tracking-[-0.04em]">{value}</p>
      {sub && <p className="mt-2 font-mono text-[11px] text-muted">{sub}</p>}
    </div>
  )
}
