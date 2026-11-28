import { ArrowLeft, CircleUser, ListFilter, Repeat, Search, SlidersHorizontal } from 'lucide-react'
import { type ReactNode, useRef, useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { Input } from '@/components/Field'
import { LabelChip } from '@/components/LabelChip'
import { Popover } from '@/components/Popover'
import { PriorityIcon, priorityName } from '@/components/PriorityIcon'
import { SegmentedControl } from '@/components/SegmentedControl'
import { SelectMenu } from '@/components/SelectMenu'
import { StatusIcon, statusName } from '@/components/StatusIcon'
import { Switch } from '@/components/Switch'
import type { PriorityId, StatusId } from '@/data'
import { setQuery } from '@/lib/router'
import { ToolbarButton } from '@/components/ToolbarButton'
import { assigneeOptions, labelOptions, priorityOptions, statusOptions } from './props'
import { activeFilterCount, EMPTY_FILTERS, type Filters, useStore } from './store'
import { type Grouping, useUI } from './ui'

type Cat = 'status' | 'priority' | 'assignee' | 'label'
const CATS: { id: Cat; name: string }[] = [
  { id: 'status', name: 'Status' },
  { id: 'priority', name: 'Priority' },
  { id: 'assignee', name: 'Assignee' },
  { id: 'label', name: 'Label' },
]

function toggle<T>(xs: T[], x: T) {
  return xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]
}

export function FilterButton() {
  const { filters, setFilters } = useUI()
  const members = useStore((s) => s.members)
  const labels = useStore((s) => s.labels)
  const [open, setOpen] = useState(false)
  const [cat, setCat] = useState<Cat | null>(null)
  const anchor = useRef<HTMLSpanElement>(null)
  const n = activeFilterCount(filters)

  let body: ReactNode
  if (!cat) {
    body = (
      <SelectMenu
        label="Filter by"
        placeholder="Filter by…"
        options={CATS.map((c) => ({ value: c.id, label: c.name }))}
        selected={[]}
        onSelect={(c) => setCat(c)}
      />
    )
  } else {
    const back = (
      <button type="button" onClick={() => setCat(null)} className="flex h-9 w-full items-center gap-2 border-t border-line px-3 text-xs text-muted hover:text-fg">
        <ArrowLeft className="size-3.5" aria-hidden /> All filters
      </button>
    )
    if (cat === 'status')
      body = <SelectMenu label="Status" multi options={statusOptions()} selected={filters.status} onSelect={(v) => setFilters((f) => ({ ...f, status: toggle(f.status, v) }))} footer={back} />
    else if (cat === 'priority')
      body = <SelectMenu label="Priority" multi options={priorityOptions()} selected={filters.priority} onSelect={(v) => setFilters((f) => ({ ...f, priority: toggle(f.priority, v) }))} footer={back} />
    else if (cat === 'assignee')
      body = <SelectMenu label="Assignee" multi options={assigneeOptions(members)} selected={filters.assignee} onSelect={(v) => setFilters((f) => ({ ...f, assignee: toggle(f.assignee, v) }))} footer={back} />
    else body = <SelectMenu label="Label" multi options={labelOptions(labels)} selected={filters.label} onSelect={(v) => setFilters((f) => ({ ...f, label: toggle(f.label, v) }))} footer={back} empty="No labels. Add some in Settings." />
  }

  return (
    <>
      <span ref={anchor} className="inline-flex">
        <ToolbarButton
          active={n > 0}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setCat(null)
            setOpen((o) => !o)
          }}
        >
          <ListFilter className="size-3.5" aria-hidden />
          Filter
          {n > 0 && <span className="font-mono text-[11px]">{n}</span>}
        </ToolbarButton>
      </span>
      <Popover open={open} onClose={() => setOpen(false)} anchor={anchor} width={260} label="Filter issues">
        <div key={cat ?? 'root'}>{body}</div>
      </Popover>
    </>
  )
}

export function DisplayButton({ board }: { board?: boolean }) {
  const { prefs, setPrefs } = useUI()
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLSpanElement>(null)
  return (
    <>
      <span ref={anchor} className="inline-flex">
        <ToolbarButton aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <SlidersHorizontal className="size-3.5" aria-hidden />
          <span className="max-sm:sr-only">Display</span>
        </ToolbarButton>
      </span>
      <Popover open={open} onClose={() => setOpen(false)} anchor={anchor} width={300} align="end" label="Display options">
        <div className="flex flex-col gap-4 p-4">
          {!board && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">Group by</span>
              <SegmentedControl<Grouping>
                label="Group by"
                value={prefs.grouping}
                onChange={(grouping) => setPrefs({ grouping })}
                options={[
                  { value: 'status', label: 'Status' },
                  { value: 'priority', label: 'Priority' },
                  { value: 'assignee', label: 'Person' },
                  { value: 'none', label: 'None' },
                ]}
              />
            </div>
          )}
          <label className="flex items-center justify-between gap-3 text-[13px]">
            Show closed issues
            <Switch label="Show closed issues" checked={prefs.showClosed} onChange={(showClosed) => setPrefs({ showClosed })} />
          </label>
        </div>
      </Popover>
    </>
  )
}

export function SearchBox({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const { filters, setFilters } = useUI()
  return (
    <Input
      ref={inputRef}
      inputSize="sm"
      icon={<Search className="size-3.5" />}
      placeholder="Search  /"
      aria-label="Search issues"
      value={filters.q}
      onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setFilters((f) => ({ ...f, q: '' }))
          ;(e.target as HTMLInputElement).blur()
        }
      }}
      className="w-full sm:w-52"
    />
  )
}

/** Chips for every active filter, each removable, plus Clear. */
export function ActiveFilters({ mine, cycle }: { mine: boolean; cycle: string | null }) {
  const { filters, setFilters } = useUI()
  const members = useStore((s) => s.members)
  const labels = useStore((s) => s.labels)
  const cycles = useStore((s) => s.cycles)
  const n = activeFilterCount(filters) + (mine ? 1 : 0) + (filters.q ? 1 : 0)
  const cyc = cycles.find((c) => c.id === cycle)
  if (!n && !cyc) return null
  const chip = (key: string, icon: ReactNode, text: string, onRemove: () => void) => (
    <LabelChip key={key} icon={icon} onRemove={onRemove} className="h-7 text-fg">
      {text}
    </LabelChip>
  )
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-3 py-2 sm:px-4">
      {mine && chip('mine', <CircleUser className="size-3.5" aria-hidden />, 'Assigned to me', () => setQuery('mine', null))}
      {cyc && chip('cycle', <Repeat className="size-3.5" aria-hidden />, cyc.name, () => setQuery('cycle', null))}
      {filters.q && chip('q', <Search className="size-3.5" aria-hidden />, `“${filters.q}”`, () => setFilters((f) => ({ ...f, q: '' })))}
      {filters.status.map((s: StatusId) => chip(`s${s}`, <StatusIcon status={s} size={12} />, statusName(s), () => setFilters((f) => ({ ...f, status: f.status.filter((x) => x !== s) }))))}
      {filters.priority.map((p: PriorityId) => chip(`p${p}`, <PriorityIcon priority={p} />, priorityName(p), () => setFilters((f) => ({ ...f, priority: f.priority.filter((x) => x !== p) }))))}
      {filters.assignee.map((a) => {
        const m = members.find((x) => x.id === a) ?? null
        return chip(`a${a}`, <Avatar member={m} size="xs" decorative />, m?.name ?? 'Unassigned', () => setFilters((f) => ({ ...f, assignee: f.assignee.filter((x) => x !== a) })))
      })}
      {filters.label.map((id) => {
        const l = labels.find((x) => x.id === id)
        return l ? <LabelChip key={id} color={l.color} onRemove={() => setFilters((f) => ({ ...f, label: f.label.filter((x) => x !== id) }))} className="h-7">{l.name}</LabelChip> : null
      })}
      <Button
        size="sm"
        variant="ghost"
        className="h-7"
        onClick={() => {
          setFilters(EMPTY_FILTERS)
          setQuery('mine', null)
          setQuery('cycle', null)
        }}
      >
        Clear
      </Button>
    </div>
  )
}

export type { Filters }
