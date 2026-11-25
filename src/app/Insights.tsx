import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { Panel, StatTile } from '@/components/Section'
import { PriorityIcon } from '@/components/PriorityIcon'
import { SegmentedControl } from '@/components/SegmentedControl'
import { CLOSED, PRIORITIES } from '@/data'
import { cn } from '@/lib/cn'
import { DAY } from '@/lib/dates'
import { PageHeader } from './IssuesView'
import { useStore } from './store'

const OPEN = 'var(--c-chart-open)'
const CLOSEDC = 'var(--c-chart-closed)'

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(600)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

type Week = { label: string; opened: number; closed: number }

function OpenClosedChart({ weeks }: { weeks: Week[] }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const H = 220
  const pad = { l: 28, r: 4, t: 10, b: 26 }
  const max = Math.max(4, ...weeks.flatMap((w) => [w.opened, w.closed]))
  const ticks = [0, Math.round(max / 2), max]
  const iw = Math.max(0, width - pad.l - pad.r)
  const band = iw / weeks.length
  const bw = Math.max(4, Math.min(18, band / 3.2))
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max)
  return (
    <div ref={ref} className="relative">
      <svg width={width} height={H} role="img" aria-label="Issues opened and closed per week, last 8 weeks">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--c-line)" />
            <text x={pad.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="var(--c-muted)" fontFamily="Geist Mono, monospace">
              {t}
            </text>
          </g>
        ))}
        {weeks.map((w, i) => {
          const cx = pad.l + band * i + band / 2
          return (
            <g key={w.label}>
              {hover === i && <rect x={pad.l + band * i} y={pad.t} width={band} height={H - pad.t - pad.b} fill="var(--c-hatch)" />}
              {(
                [
                  [w.opened, OPEN, cx - bw - 1],
                  [w.closed, CLOSEDC, cx + 1],
                ] as const
              ).map(([v, c, x], k) => (
                <motion.rect
                  key={k}
                  x={x}
                  width={bw}
                  initial={{ y: y(0), height: 0 }}
                  animate={{ y: y(v), height: Math.max(0, y(0) - y(v)) }}
                  transition={{ duration: 0.6, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  fill={c}
                />
              ))}
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--c-muted)" fontFamily="Geist Mono, monospace">
                {w.label}
              </text>
              <rect
                x={pad.l + band * i}
                y={0}
                width={band}
                height={H}
                fill="transparent"
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover((h) => (h === i ? null : h))}
              />
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-36 border border-line-strong bg-raised px-3 py-2 text-xs shadow-pop"
          style={{ left: Math.min(width - 150, Math.max(0, pad.l + band * hover + band / 2 - 72)) }}
        >
          <p className="font-mono text-muted">Week of {weeks[hover].label}</p>
          <p className="mt-1.5 flex items-center gap-2">
            <span className="size-2" style={{ background: OPEN }} /> Opened <span className="ml-auto font-mono">{weeks[hover].opened}</span>
          </p>
          <p className="mt-1 flex items-center gap-2">
            <span className="size-2" style={{ background: CLOSEDC }} /> Closed <span className="ml-auto font-mono">{weeks[hover].closed}</span>
          </p>
        </div>
      )}
    </div>
  )
}

function HBars({ rows, label }: { rows: { key: string; name: string; icon: React.ReactNode; value: number }[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul aria-label={label} className="flex flex-col gap-2.5">
      {rows.map((r, i) => (
        <li key={r.key} className="group grid grid-cols-[132px_1fr_32px] items-center gap-3 text-[13px]" title={`${r.name}: ${r.value}`}>
          <span className="flex min-w-0 items-center gap-2">
            {r.icon}
            <span className="truncate">{r.name}</span>
          </span>
          <span className="relative h-3">
            <motion.span
              className="absolute inset-y-0 left-0 bg-fg/60 transition-colors group-hover:bg-fg/90"
              initial={{ width: 0 }}
              animate={{ width: `${(r.value / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
          <span className="text-right font-mono text-xs text-muted">{r.value}</span>
        </li>
      ))}
    </ul>
  )
}

export function Insights() {
  const issues = useStore((s) => s.issues)
  const members = useStore((s) => s.members)
  const [mode, setMode] = useState<'chart' | 'table'>('chart')

  const weeks = useMemo<Week[]>(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime() - 7 * 7 * DAY
    return Array.from({ length: 8 }, (_, i) => {
      const a = start + i * 7 * DAY
      const b = a + 7 * DAY
      const d = new Date(a)
      return {
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        opened: issues.filter((x) => x.createdAt >= a && x.createdAt < b).length,
        closed: issues.filter((x) => x.completedAt !== null && x.completedAt >= a && x.completedAt < b).length,
      }
    })
  }, [issues])

  const open = issues.filter((i) => !CLOSED.includes(i.status))
  const since = Date.now() - 14 * DAY
  const closed14 = issues.filter((i) => i.completedAt && i.completedAt >= since && i.status === 'done').length
  const opened14 = issues.filter((i) => i.createdAt >= since).length
  const durations = issues
    .filter((i) => i.status === 'done' && i.completedAt)
    .map((i) => (i.completedAt! - i.createdAt) / DAY)
    .sort((a, b) => a - b)
  const median = durations.length ? durations[Math.floor(durations.length / 2)] : 0

  const byPriority = PRIORITIES.map((p) => ({ key: String(p.id), name: p.name, icon: <PriorityIcon priority={p.id} />, value: open.filter((i) => i.priority === p.id).length }))
  const byPerson = [
    ...members.map((m) => ({ key: m.id, name: m.name, icon: <Avatar member={m} size="xs" decorative />, value: open.filter((i) => i.assigneeId === m.id).length })),
    { key: 'none', name: 'Unassigned', icon: <Avatar member={null} size="xs" decorative />, value: open.filter((i) => !i.assigneeId).length },
  ].sort((a, b) => b.value - a.value)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Insights" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 border-b border-l border-line lg:grid-cols-4">
          <StatTile label="Open issues" value={open.length} sub={`${open.filter((i) => i.priority === 1).length} urgent`} />
          <StatTile label="Closed, last 14 days" value={closed14} />
          <StatTile label="Opened, last 14 days" value={opened14} sub={opened14 > closed14 ? 'more in than out' : 'burning down'} />
          <StatTile label="Median time to close" value={`${median.toFixed(1)}d`} sub={`across ${durations.length} done`} />
        </div>
        <div className="grid gap-4 p-4 xl:grid-cols-[1.6fr_1fr]">
          <Panel
            as="section"
            title="Opened vs closed, per week"
            actions={
              <>
                <span className="flex items-center gap-3 text-xs text-muted" aria-hidden={mode === 'table'}>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2" style={{ background: OPEN }} /> Opened
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2" style={{ background: CLOSEDC }} /> Closed
                  </span>
                </span>
                <SegmentedControl
                  label="Chart or table"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: 'chart', label: 'Chart' },
                    { value: 'table', label: 'Table' },
                  ]}
                />
              </>
            }
          >
            {mode === 'chart' ? (
              <OpenClosedChart weeks={weeks} />
            ) : (
              <table className="w-full text-[13px]">
                <caption className="sr-only">Issues opened and closed per week</caption>
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th className="py-2 font-normal">Week of</th>
                    <th className="py-2 text-right font-normal">Opened</th>
                    <th className="py-2 text-right font-normal">Closed</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {weeks.map((w) => (
                    <tr key={w.label} className="border-b border-line last:border-0">
                      <td className="py-2">{w.label}</td>
                      <td className="py-2 text-right">{w.opened}</td>
                      <td className="py-2 text-right">{w.closed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
          <Panel as="section" title="Open issues by priority">
            <HBars rows={byPriority} label="Open issues by priority" />
          </Panel>
          <Panel as="section" title="Open issues by person">
            <HBars rows={byPerson} label="Open issues by person" />
          </Panel>
          <Panel as="section" title="Status mix">
            <StatusMix />
          </Panel>
        </div>
      </div>
    </div>
  )
}

function StatusMix() {
  const issues = useStore((s) => s.issues)
  const parts = (['backlog', 'todo', 'in_progress', 'in_review', 'blocked', 'done', 'canceled'] as const).map((s) => ({ s, n: issues.filter((i) => i.status === s).length }))
  const total = Math.max(1, issues.length)
  return (
    <div>
      <div className="flex h-6 w-full gap-[2px]" role="img" aria-label="Share of issues by status">
        {parts
          .filter((p) => p.n)
          .map((p, i) => (
            <motion.span
              key={p.s}
              initial={{ flexGrow: 0 }}
              animate={{ flexGrow: p.n }}
              transition={{ duration: 0.6, delay: i * 0.04 }}
              className={cn('h-full', p.s === 'backlog' && 'hatch-strong')}
              style={{ flexBasis: 0, background: p.s === 'backlog' ? undefined : `var(--c-${p.s === 'in_progress' ? 'progress' : p.s === 'in_review' ? 'review' : p.s})` }}
              title={`${p.s.replace('_', ' ')}: ${p.n}`}
            />
          ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
        {parts.map((p) => (
          <li key={p.s} className="flex items-center gap-2 capitalize">
            <span className="size-2" style={{ background: `var(--c-${p.s === 'in_progress' ? 'progress' : p.s === 'in_review' ? 'review' : p.s})` }} aria-hidden />
            {p.s.replace('_', ' ')}
            <span className="ml-auto font-mono text-xs text-muted">{Math.round((p.n / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
