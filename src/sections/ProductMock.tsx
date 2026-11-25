import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

import { Skeleton } from '@/components/Skeleton'
import { STATUS_COLOR } from '@/components/StatusIcon'
import type { StatusId } from '@/data'
import { cn } from '@/lib/cn'

/*
  The illustrated product shot under the hero: a 3-pane app drawn with
  skeleton bars, like the reference. It is live — hover a row, click it (or
  let it auto-advance) and the hatched selection and the detail pane follow.
*/

type Row = { id: number; status: StatusId; dot: string; w: number }

const ROWS: Row[] = [
  { id: 142, status: 'blocked', dot: 'var(--c-progress)', w: 274 },
  { id: 139, status: 'blocked', dot: 'var(--c-blocked)', w: 335 },
  { id: 138, status: 'in_progress', dot: 'var(--c-todo)', w: 244 },
  { id: 135, status: 'todo', dot: 'var(--c-done)', w: 305 },
  { id: 131, status: 'canceled', dot: 'var(--c-todo)', w: 213 },
  { id: 128, status: 'in_progress', dot: 'var(--c-progress)', w: 290 },
  { id: 125, status: 'todo', dot: 'var(--c-done)', w: 259 },
]

const PROPS = ['Status', 'Priority', 'Assignee', 'Due'] as const

function MockStatus({ status }: { status: StatusId }) {
  return (
    <span className="flex size-[15px] items-center justify-center border border-line-strong" aria-hidden>
      <span className="size-[6px]" style={{ background: status === 'canceled' ? 'var(--c-line-strong)' : STATUS_COLOR[status] }} />
    </span>
  )
}

export function ProductMock({ className }: { className?: string }) {
  const [sel, setSel] = useState(1)
  const [auto, setAuto] = useState(true)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!auto || reduce) return
    const id = window.setInterval(() => setSel((s) => (s + 1) % ROWS.length), 2800)
    return () => window.clearInterval(id)
  }, [auto, reduce])

  const row = ROWS[sel]
  const detailDots = [STATUS_COLOR[row.status === 'canceled' ? 'todo' : row.status], row.dot, 'var(--c-todo)', 'var(--c-line-strong)']

  return (
    <figure
      className={cn('overflow-hidden rounded-t-frame border border-b-0 border-line-strong bg-surface', className)}
      aria-label="Preview of the Triage app: sidebar, issue list and issue details"
      onPointerEnter={() => setAuto(false)}
      onPointerLeave={() => setAuto(true)}
    >
      <div className="grid grid-cols-1 md:grid-cols-[229px_1fr_320px]" aria-hidden="true">
        {/* Sidebar */}
        <div className="hidden border-r border-line md:block">
          <div className="flex h-[45px] items-center gap-2.5 px-6">
            <span className="size-[18px] rounded-[3px] bg-line-strong/70" />
            <Skeleton w={74} h={8} className="rounded-full" />
          </div>
          <div className="mx-3.5 border-t border-line" />
          <div className="flex flex-col gap-1 px-3.5 py-3">
            {[91, 73, 110, 64].map((w, i) => (
              <div key={i} className={cn('flex h-[27px] items-center gap-3 rounded-[3px] px-2.5', i === 2 && 'bg-surface-2')}>
                <span className="size-[13px] rounded-[2px] bg-skel" />
                <Skeleton w={w} h={6} className={cn('rounded-full', i === 2 && 'bg-line-strong')} />
              </div>
            ))}
          </div>
          <div className="mx-3.5 border-t border-line" />
          <div className="px-6 py-3">
            <Skeleton w={64} h={6} className="rounded-full" />
            <div className="mt-6 flex flex-col gap-7">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-[8px] rounded-full bg-skel" />
              ))}
            </div>
          </div>
        </div>

        {/* Issue list */}
        <div className="min-w-0 border-r border-line">
          <div className="flex h-[45px] items-center gap-3.5 border-b border-line px-5">
            <Skeleton w={46} h={8} className="rounded-full" />
            <Skeleton w={36} h={8} className="rounded-full" />
            <Skeleton w={55} h={8} className="rounded-full" />
          </div>
          <div>
            {ROWS.map((r, i) => (
              <button
                key={r.id}
                type="button"
                tabIndex={-1}
                onClick={() => setSel(i)}
                className={cn(
                  'relative flex h-[41px] w-full items-center gap-3 border-b border-line px-5 text-left transition-colors duration-150',
                  i === sel ? '' : 'hover:bg-surface-2/60',
                )}
              >
                {i === sel && (
                  <motion.span layoutId="mock-sel" className="hatch absolute inset-0 bg-surface-2/50" transition={{ type: 'spring', stiffness: 380, damping: 36 }} />
                )}
                <span className="relative z-[1] flex items-center gap-3">
                  <MockStatus status={r.status} />
                  <span className="font-mono text-[12px] tracking-[0.02em] text-muted">TRG-{r.id}</span>
                </span>
                <Skeleton w={r.w} h={6} className="relative z-[1] max-w-[45%] rounded-full" />
                <span className="relative z-[1] ml-auto flex items-center gap-4">
                  <span className="size-[9px] rounded-full" style={{ background: r.dot }} />
                  <span className="size-[23px] rounded-full bg-surface-2 ring-1 ring-line" />
                </span>
              </button>
            ))}
            <div className="h-[72px]" />
          </div>
        </div>

        {/* Detail */}
        <div className="hidden md:block">
          <div className="flex h-[45px] items-center justify-between border-b border-line px-5">
            <Skeleton w={91} h={8} className="rounded-full" />
            <span className="flex gap-1.5">
              <span className="size-[17px] rounded-[3px] bg-surface-2" />
              <span className="size-[17px] rounded-[3px] bg-surface-2" />
            </span>
          </div>
          <div className="px-[18px] pt-4">
            <motion.div key={row.id} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <Skeleton w={146} h={9} className="rounded-full" />
              <Skeleton w="100%" h={6} className="mt-5 rounded-full" />
              <Skeleton w="75%" h={6} className="mt-2 rounded-full" />
            </motion.div>
            <div className="mt-5 border-t border-line" />
            <dl className="flex flex-col py-2.5">
              {PROPS.map((p, i) => (
                <div key={p} className="flex h-[37px] items-center justify-between">
                  <dt className="text-[12px] text-muted">{p}</dt>
                  <dd>
                    <motion.span
                      className="block size-[11px] rounded-full"
                      animate={{ backgroundColor: detailDots[i] }}
                      transition={{ duration: 0.35 }}
                    />
                  </dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-line" />
            <Skeleton w={63} h={6} className="mt-6 rounded-full" />
            <div className="mt-5 flex flex-col gap-3.5">
              <span className="size-[22px] rounded-full bg-surface-2" />
              <span className="size-[22px] rounded-full bg-surface-2" />
            </div>
          </div>
        </div>
      </div>
    </figure>
  )
}
