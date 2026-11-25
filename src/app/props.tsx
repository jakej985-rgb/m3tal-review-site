import { Calendar, Repeat, Tag } from 'lucide-react'
import { type ReactNode, useRef, useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { DueBadge } from '@/components/DueBadge'
import { LabelChip } from '@/components/LabelChip'
import { Popover } from '@/components/Popover'
import { PriorityIcon, priorityName } from '@/components/PriorityIcon'
import { Picker } from '@/components/Picker'
import type { MenuOption } from '@/components/SelectMenu'
import { StatusIcon, statusName } from '@/components/StatusIcon'
import { type Cycle, type Label, type Member, PRIORITIES, type PriorityId, STATUSES, type StatusId } from '@/data'
import { cn } from '@/lib/cn'
import { addDays, isoDay, shortDate } from '@/lib/dates'
import { useStore } from './store'

/*
  Property pickers shared by the list rows, board cards, the detail pane and
  the create modal. Each is a Picker (Popover + SelectMenu) with its own
  trigger; `variant` picks the trigger: 'icon' (row/card), 'field' (detail
  pane / modal).
*/

export const statusOptions = (): MenuOption<StatusId>[] => STATUSES.map((s) => ({ value: s.id, label: s.name, icon: <StatusIcon status={s.id} /> }))
export const priorityOptions = (): MenuOption<PriorityId>[] => PRIORITIES.map((p) => ({ value: p.id, label: p.name, icon: <PriorityIcon priority={p.id} /> }))
export const assigneeOptions = (members: Member[]): MenuOption<string>[] => [
  { value: 'none', label: 'Unassigned', icon: <Avatar member={null} size="xs" decorative /> },
  ...members.map((m) => ({ value: m.id, label: m.name, keywords: m.handle, icon: <Avatar member={m} size="xs" decorative /> })),
]
export const labelOptions = (labels: Label[]): MenuOption<string>[] =>
  labels.map((l) => ({ value: l.id, label: l.name, icon: <span className="size-2.5" style={{ background: l.color }} aria-hidden /> }))
export const cycleOptions = (cycles: Cycle[]): MenuOption<string>[] => [
  { value: 'none', label: 'No cycle', icon: <Repeat className="size-3.5 text-faint" aria-hidden /> },
  ...cycles.map((c) => ({ value: c.id, label: c.name, hint: `${shortDate(c.start)} – ${shortDate(c.end)}`, icon: <Repeat className="size-3.5 text-muted" aria-hidden /> })),
]

type Variant = 'icon' | 'field'

const fieldBtn =
  'flex h-8 w-full min-w-0 items-center gap-2 px-2 -mx-2 text-left text-[13px] text-fg transition-colors hover:bg-surface-2 aria-expanded:bg-surface-2'
const iconBtn = 'inline-flex size-8 pointer-coarse:size-10 items-center justify-center transition-colors hover:bg-surface-2 aria-expanded:bg-surface-2'

export function StatusPicker({ value, onChange, variant = 'field' }: { value: StatusId; onChange: (s: StatusId) => void; variant?: Variant }) {
  return (
    <Picker label="Change status" options={statusOptions()} selected={[value]} onSelect={onChange} placeholder="Change status…">
      {(p) => (
        <button type="button" {...p} className={variant === 'icon' ? iconBtn : fieldBtn} aria-label={variant === 'icon' ? `Status: ${statusName(value)}` : undefined}>
          <StatusIcon status={value} />
          {variant === 'field' && <span className="truncate">{statusName(value)}</span>}
        </button>
      )}
    </Picker>
  )
}

export function PriorityPicker({ value, onChange, variant = 'field' }: { value: PriorityId; onChange: (p: PriorityId) => void; variant?: Variant }) {
  return (
    <Picker label="Change priority" options={priorityOptions()} selected={[value]} onSelect={onChange} placeholder="Set priority…">
      {(p) => (
        <button type="button" {...p} className={variant === 'icon' ? iconBtn : fieldBtn} aria-label={variant === 'icon' ? `Priority: ${priorityName(value)}` : undefined}>
          <PriorityIcon priority={value} />
          {variant === 'field' && <span className="truncate">{priorityName(value)}</span>}
        </button>
      )}
    </Picker>
  )
}

export function AssigneePicker({ value, onChange, variant = 'field' }: { value: string | null; onChange: (id: string | null) => void; variant?: Variant }) {
  const members = useStore((s) => s.members)
  const m = members.find((x) => x.id === value) ?? null
  return (
    <Picker label="Assign to" options={assigneeOptions(members)} selected={[value ?? 'none']} onSelect={(v) => onChange(v === 'none' ? null : v)} placeholder="Assign to…" align={variant === 'icon' ? 'end' : 'start'}>
      {(p) => (
        <button type="button" {...p} className={variant === 'icon' ? cn(iconBtn, 'rounded-full') : fieldBtn} title={variant === 'icon' ? `Assignee: ${m?.name ?? 'Unassigned'}` : undefined}>
          <Avatar member={m} size={variant === 'icon' ? 'sm' : 'xs'} decorative />
          {variant === 'icon' && <span className="sr-only">Assignee: {m?.name ?? 'Unassigned'}</span>}
          {variant === 'field' && <span className={cn('truncate', !m && 'text-muted')}>{m?.name ?? 'Unassigned'}</span>}
        </button>
      )}
    </Picker>
  )
}

export function LabelsPicker({ value, onChange, children }: { value: string[]; onChange: (ids: string[]) => void; children?: ReactNode }) {
  const labels = useStore((s) => s.labels)
  const chosen = labels.filter((l) => value.includes(l.id))
  return (
    <Picker
      label="Labels"
      multi
      options={labelOptions(labels)}
      selected={value}
      onSelect={(id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])}
      placeholder="Add labels…"
    >
      {(p) => (
        <button type="button" {...p} className={cn(fieldBtn, 'h-auto min-h-8 flex-wrap py-1')}>
          {children ??
            (chosen.length ? (
              chosen.map((l) => (
                <LabelChip key={l.id} color={l.color}>
                  {l.name}
                </LabelChip>
              ))
            ) : (
              <span className="inline-flex items-center gap-2 text-muted">
                <Tag className="size-3.5" aria-hidden /> Add label
              </span>
            ))}
        </button>
      )}
    </Picker>
  )
}

export function CyclePicker({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const cycles = useStore((s) => s.cycles)
  const c = cycles.find((x) => x.id === value)
  return (
    <Picker label="Cycle" options={cycleOptions(cycles)} selected={[value ?? 'none']} onSelect={(v) => onChange(v === 'none' ? null : v)} placeholder="Move to cycle…">
      {(p) => (
        <button type="button" {...p} className={fieldBtn}>
          <Repeat className="size-3.5 text-muted" aria-hidden />
          <span className={cn('truncate', !c && 'text-muted')}>{c?.name ?? 'No cycle'}</span>
        </button>
      )}
    </Picker>
  )
}

export function DuePicker({ value, onChange }: { value: string | null; onChange: (d: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)
  const today = new Date()
  const quick: [string, string | null][] = [
    ['Today', isoDay(today)],
    ['Tomorrow', isoDay(addDays(today, 1))],
    ['In a week', isoDay(addDays(today, 7))],
    ['In two weeks', isoDay(addDays(today, 14))],
  ]
  const pick = (d: string | null) => {
    onChange(d)
    setOpen(false)
  }
  return (
    <>
      <button ref={anchor} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={fieldBtn}>
        {value ? <DueBadge due={value} className="text-[13px]" /> : (
          <span className="inline-flex items-center gap-2 text-muted">
            <Calendar className="size-3.5" aria-hidden /> No due date
          </span>
        )}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={anchor} width={240} label="Due date">
        <div className="flex flex-col py-1">
          {quick.map(([label, d]) => (
            <button key={label} type="button" onClick={() => pick(d)} className="mx-1 flex h-9 items-center justify-between px-2 text-left text-[13px] hover:bg-surface-2 focus-visible:bg-surface-2">
              {label}
              <span className="font-mono text-[11px] text-faint">{d && shortDate(d)}</span>
            </button>
          ))}
          <div className="mx-3 my-1 border-t border-line" />
          <label className="flex flex-col gap-1 px-3 py-2 text-xs text-muted">
            Pick a date
            <input
              type="date"
              value={value ?? ''}
              onChange={(e) => pick(e.target.value || null)}
              className="h-9 border border-line bg-transparent px-2 text-[13px] text-fg [color-scheme:inherit]"
            />
          </label>
          {value && (
            <div className="px-3 pt-1 pb-2">
              <Button size="sm" variant="ghost" className="w-full" onClick={() => pick(null)}>
                Clear due date
              </Button>
            </div>
          )}
        </div>
      </Popover>
    </>
  )
}
