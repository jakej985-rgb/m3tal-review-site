import { Kanban, LayoutList, Menu, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/Button'
import { Drawer } from '@/components/Drawer'
import { EmptyState } from '@/components/EmptyState'
import { IconButton } from '@/components/IconButton'
import { SegmentedControl } from '@/components/SegmentedControl'
import { CLOSED } from '@/data'
import { navigate, useLocation } from '@/lib/router'
import { Board } from './Board'
import { DetailPane } from './DetailPane'
import { ActiveFilters, DisplayButton, FilterButton, SearchBox } from './FilterBar'
import { groupIssues, IssueList } from './IssueList'
import { filterIssues, sortIssues, useStore } from './store'
import { isTyping, useUI } from './ui'

function useWide(min = 1180) {
  const [wide, setWide] = useState(() => window.innerWidth >= min)
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${min}px)`)
    const on = () => setWide(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [min])
  return wide
}

export function PageHeader({ title, children, count }: { title: string; children?: React.ReactNode; count?: number }) {
  const ui = useUI()
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line pr-2 pl-2 sm:pr-3 md:pl-5">
      <IconButton label="Open navigation" className="md:hidden" onClick={ui.openNav}>
        <Menu className="size-5" />
      </IconButton>
      <h1 className="truncate text-[15px] font-medium">{title}</h1>
      {count !== undefined && <span className="font-mono text-xs text-muted">{count}</span>}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  )
}

export function IssuesView({ view }: { view: 'list' | 'board' }) {
  const ui = useUI()
  const { search } = useLocation()
  const mine = search.get('mine') === '1'
  const cycle = search.get('cycle')
  const all = useStore((s) => s.issues)
  const members = useStore((s) => s.members)
  const labels = useStore((s) => s.labels)
  const meId = useStore((s) => s.meId)
  const cycles = useStore((s) => s.cycles)
  const wide = useWide()
  const searchRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState<number | null>(null)

  const effective = useMemo(() => ({ ...ui.filters, mine, cycle }), [ui.filters, mine, cycle])
  const filtered = useMemo(() => {
    const xs = sortIssues(filterIssues(all, effective, meId))
    // When the user filters on a closed status explicitly, show it.
    const wantsClosed = ui.prefs.showClosed || effective.status.some((s) => CLOSED.includes(s))
    return wantsClosed ? xs : xs.filter((i) => !CLOSED.includes(i.status))
  }, [all, effective, meId, ui.prefs.showClosed])

  const groups = useMemo(() => groupIssues(filtered, ui.prefs.grouping, members), [filtered, ui.prefs.grouping, members])
  const visible = useMemo(() => groups.filter((g) => !ui.prefs.collapsed.includes(g.key)).flatMap((g) => g.issues), [groups, ui.prefs.collapsed])

  const title = mine ? 'My issues' : cycle ? (cycles.find((c) => c.id === cycle)?.name ?? 'Cycle') : view === 'board' ? 'Board' : 'All issues'

  const step = (dir: 1 | -1) => {
    if (!visible.length) return
    const cur = focused ?? ui.selected
    const i = visible.findIndex((x) => x.number === cur)
    const next = visible[i === -1 ? 0 : Math.max(0, Math.min(visible.length - 1, i + dir))]
    setFocused(next.number)
    if (ui.selected !== null) ui.openIssue(next.number)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTyping(e)) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (view === 'list' && (e.key === 'j' || e.key === 'ArrowDown')) {
        e.preventDefault()
        step(1)
      } else if (view === 'list' && (e.key === 'k' || e.key === 'ArrowUp')) {
        e.preventDefault()
        step(-1)
      } else if (e.key === 'Enter' && focused !== null && view === 'list') {
        const t = e.target as HTMLElement
        if (t.closest('button, a')) return
        e.preventDefault()
        ui.openIssue(focused)
      } else if (e.key === 'Escape' && ui.selected !== null) {
        ui.openIssue(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const open = (n: number) => {
    setFocused(n)
    ui.openIssue(n)
  }
  const close = () => ui.openIssue(null)
  const showPane = view === 'list' && wide && ui.selected !== null

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader title={title} count={filtered.length}>
          <SegmentedControl
            label="View"
            value={view}
            onChange={(v) => navigate(v === 'board' ? `/app/board${window.location.search}` : `/app${window.location.search}`)}
            options={[
              { value: 'list', label: <span className="max-sm:sr-only">List</span>, icon: <LayoutList className="size-3.5" aria-hidden /> },
              { value: 'board', label: <span className="max-sm:sr-only">Board</span>, icon: <Kanban className="size-3.5" aria-hidden /> },
            ]}
          />
          <Button size="sm" variant="primary" icon={<Plus className="size-4" />} onClick={() => ui.openCreate(cycle ? { cycleId: cycle } : mine ? { assigneeId: meId } : undefined)}>
            <span className="max-sm:sr-only">New issue</span>
          </Button>
        </PageHeader>
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-3 py-2 sm:px-4">
          <FilterButton />
          <DisplayButton board={view === 'board'} />
          <div className="ml-auto w-full sm:w-auto">
            <SearchBox inputRef={searchRef} />
          </div>
        </div>
        <ActiveFilters mine={mine} cycle={cycle} />
        <div className="min-h-0 flex-1 overflow-auto bg-surface">
          {filtered.length === 0 ? (
            <EmptyState
              title={all.length === 0 ? 'No issues yet' : 'No issues match'}
              body={all.length === 0 ? 'Create the first one and it will show up here.' : 'Try removing a filter or searching for something else.'}
              action={
                <Button variant="primary" size="sm" icon={<Plus className="size-4" />} onClick={() => ui.openCreate()}>
                  New issue
                </Button>
              }
            />
          ) : view === 'list' ? (
            <IssueList
              groups={groups}
              labels={labels}
              selected={ui.selected}
              focused={focused}
              collapsed={ui.prefs.collapsed}
              onToggle={(key) => ui.setPrefs({ collapsed: ui.prefs.collapsed.includes(key) ? ui.prefs.collapsed.filter((k) => k !== key) : [...ui.prefs.collapsed, key] })}
              onOpen={open}
              onCreate={(defaults) => ui.openCreate({ ...defaults, ...(cycle ? { cycleId: cycle } : {}) })}
            />
          ) : (
            <Board issues={filtered} showClosed={ui.prefs.showClosed || effective.status.some((s) => CLOSED.includes(s))} onOpen={open} selected={ui.selected} />
          )}
        </div>
      </div>
      {showPane && (
        <aside aria-label="Issue details" className="flex w-[380px] shrink-0 border-l border-line bg-surface">
          <DetailPane number={ui.selected!} onClose={close} onStep={step} className="w-full" />
        </aside>
      )}
      <Drawer open={!showPane && ui.selected !== null} onClose={close} title="Issue details" width={460}>
        {ui.selected !== null && <DetailPane number={ui.selected} onClose={close} className="h-full" />}
      </Drawer>
    </div>
  )
}
