import { ArrowRight, BookOpen, ChartColumn, CircleUser, House, Inbox, Kanban, LayoutList, Moon, Plus, Search, Settings } from 'lucide-react'
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'

import { Kbd } from '@/components/Kbd'
import { Modal } from '@/components/Modal'
import { StatusIcon } from '@/components/StatusIcon'
import { cn } from '@/lib/cn'
import { navigate } from '@/lib/router'
import { toggleTheme } from '@/lib/theme'
import { issueKey, useStore } from './store'

type Item = { id: string; group: 'Actions' | 'Navigate' | 'Issues'; label: string; hint?: string; icon: ReactNode; run: () => void; keywords?: string }

export function CommandPalette({ open, onClose, onCreate, onOpenIssue }: { open: boolean; onClose: () => void; onCreate: () => void; onOpenIssue: (n: number) => void }) {
  const issues = useStore((s) => s.issues)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const id = useId()
  const listRef = useRef<HTMLDivElement>(null)

  // Start every opening empty, however it was closed (⌘K toggles too).
  useEffect(() => {
    if (!open) {
      setQ('')
      setActive(0)
    }
  }, [open])
  const close = () => {
    onClose()
    setQ('')
    setActive(0)
  }

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => navigate(to)
    const ic = 'size-4'
    const base: Item[] = [
      { id: 'new', group: 'Actions', label: 'Create new issue', hint: 'C', icon: <Plus className={ic} />, run: onCreate },
      { id: 'theme', group: 'Actions', label: 'Toggle light / dark theme', icon: <Moon className={ic} />, run: toggleTheme, keywords: 'appearance mode' },
      { id: 'inbox', group: 'Navigate', label: 'Go to Inbox', icon: <Inbox className={ic} />, run: go('/app/inbox'), keywords: 'notifications' },
      { id: 'mine', group: 'Navigate', label: 'Go to My issues', icon: <CircleUser className={ic} />, run: go('/app?mine=1') },
      { id: 'all', group: 'Navigate', label: 'Go to All issues', icon: <LayoutList className={ic} />, run: go('/app'), keywords: 'list' },
      { id: 'board', group: 'Navigate', label: 'Go to Board', icon: <Kanban className={ic} />, run: go('/app/board'), keywords: 'kanban' },
      { id: 'insights', group: 'Navigate', label: 'Go to Insights', icon: <ChartColumn className={ic} />, run: go('/app/insights'), keywords: 'chart stats' },
      { id: 'settings', group: 'Navigate', label: 'Go to Settings', icon: <Settings className={ic} />, run: go('/app/settings'), keywords: 'labels members' },
      { id: 'styleguide', group: 'Navigate', label: 'Open style guide', icon: <BookOpen className={ic} />, run: go('/styleguide'), keywords: 'design system' },
      { id: 'home', group: 'Navigate', label: 'Back to website', icon: <House className={ic} />, run: go('/'), keywords: 'landing' },
    ]
    const s = q.trim().toLowerCase()
    const matched = s ? base.filter((i) => `${i.label} ${i.keywords ?? ''}`.toLowerCase().includes(s)) : base
    const issueHits = s
      ? issues.filter((i) => `${issueKey(i.number)} ${i.number} ${i.title}`.toLowerCase().includes(s)).slice(0, 8)
      : issues.slice(0, 5)
    return [
      ...matched,
      ...issueHits.map<Item>((i) => ({
        id: `i${i.number}`,
        group: 'Issues',
        label: i.title,
        hint: issueKey(i.number),
        icon: <StatusIcon status={i.status} />,
        run: () => onOpenIssue(i.number),
      })),
    ]
  }, [q, issues, onCreate, onOpenIssue])

  useEffect(() => setActive(0), [q])
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const run = (item: Item | undefined) => {
    if (!item) return
    close()
    // Let the modal's focus restore finish before the action moves focus again.
    requestAnimationFrame(() => item.run())
  }

  let lastGroup = ''
  return (
    <Modal open={open} onClose={close} title="Command palette" bare width={620} position="top">
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="size-4 text-muted" aria-hidden />
        <input
          data-autofocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a command or search issues…"
          aria-label="Command or issue"
          role="combobox"
          aria-expanded
          aria-controls={`${id}-list`}
          aria-activedescendant={items[active] ? `${id}-${active}` : undefined}
          className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-faint"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(a + 1, items.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              run(items[active])
            }
          }}
        />
        <Kbd>esc</Kbd>
      </div>
      <div ref={listRef} id={`${id}-list`} role="listbox" aria-label="Results" className="max-h-[min(420px,60vh)] overflow-y-auto py-2">
        {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">Nothing matches “{q}”.</p>}
        {items.map((item, i) => {
          const header = item.group !== lastGroup ? item.group : null
          lastGroup = item.group
          return (
            <div key={item.id} role="presentation">
              {header && <p className="px-4 pt-3 pb-1.5 font-mono text-[11px] tracking-[0.12em] text-muted uppercase" role="presentation">{header}</p>}
              <div
                id={`${id}-${i}`}
                data-i={i}
                role="option"
                aria-selected={i === active}
                onPointerMove={() => setActive(i)}
                onClick={() => run(item)}
                className={cn('relative mx-2 flex h-10 cursor-pointer items-center gap-3 px-3 text-sm', i === active ? 'bg-surface-2 text-fg' : 'text-fg/90')}
              >
                {i === active && <span className="absolute inset-y-2 left-0 w-px bg-fg" aria-hidden />}
                <span className="flex size-4 items-center justify-center text-muted">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.hint && <span className="font-mono text-[11px] text-muted">{item.hint}</span>}
                {i === active && <ArrowRight className="size-3.5 text-muted" aria-hidden />}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> move
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd> open
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd> toggle
        </span>
      </div>
    </Modal>
  )
}
