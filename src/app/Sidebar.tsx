import { ChartColumn, CircleUser, Inbox, Kanban, LayoutList, Plus, Repeat, Search, Settings } from 'lucide-react'
import type { ReactNode } from 'react'

import { Avatar } from '@/components/Avatar'
import { Kbd } from '@/components/Kbd'
import { LogoMark } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { CLOSED } from '@/data'
import { cn } from '@/lib/cn'
import { Link, useLocation } from '@/lib/router'
import { useStore } from './store'
import { useUI } from './ui'

function NavItem({ to, icon, children, count, active, onNavigate }: { to: string; icon: ReactNode; children: ReactNode; count?: number; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex h-9 items-center gap-3 px-2.5 text-[13.5px] transition-colors md:h-8',
        active ? 'bg-surface-2 text-fg' : 'text-muted hover:bg-surface-2/60 hover:text-fg',
      )}
    >
      {active && <span className="absolute inset-y-1.5 left-0 w-px bg-fg" aria-hidden />}
      <span className={cn('flex size-4 items-center justify-center', active ? 'text-fg' : 'text-faint group-hover:text-muted')}>{icon}</span>
      <span className="flex-1 truncate">{children}</span>
      {!!count && <span className="font-mono text-[11px] text-muted">{count}</span>}
    </Link>
  )
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname, search } = useLocation()
  const ui = useUI()
  const workspace = useStore((s) => s.workspace)
  const me = useStore((s) => s.members.find((m) => m.id === s.meId))
  const unread = useStore((s) => s.notices.filter((n) => !n.read).length)
  const mineOpen = useStore((s) => s.issues.filter((i) => i.assigneeId === s.meId && !CLOSED.includes(i.status)).length)
  const cycles = useStore((s) => s.cycles)
  const issues = useStore((s) => s.issues)
  const isIssues = pathname === '/app' || pathname === '/app/board'
  const mineOn = isIssues && search.get('mine') === '1'
  const cycleOn = isIssues ? search.get('cycle') : null

  const icon = 'size-4'
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2.5 px-4">
        <span className="flex size-6 items-center justify-center bg-invert text-invert-fg">
          <LogoMark className="size-3.5" />
        </span>
        <span className="flex-1 truncate text-sm font-medium">{workspace}</span>
        <ThemeToggle size="sm" />
      </div>
      <div className="flex gap-1.5 px-3 pb-3">
        <button
          type="button"
          onClick={() => {
            onNavigate?.()
            ui.openCreate()
          }}
          className="flex h-8 flex-1 items-center gap-2 border border-line-strong px-2.5 text-[13px] text-fg transition-colors hover:bg-surface-2 active:translate-y-px"
        >
          <Plus className="size-4" aria-hidden /> New issue <Kbd className="ml-auto h-[18px] border-line">C</Kbd>
        </button>
        <button
          type="button"
          onClick={() => {
            onNavigate?.()
            ui.openPalette()
          }}
          aria-label="Search and commands"
          title="Search and commands (⌘K)"
          className="flex size-8 items-center justify-center border border-line-strong text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <Search className="size-4" aria-hidden />
        </button>
      </div>
      <div className="mx-3 border-t border-line" />
      <nav aria-label="Workspace" className="flex flex-col gap-px p-3">
        <NavItem to="/app/inbox" icon={<Inbox className={icon} />} count={unread} active={pathname === '/app/inbox'} onNavigate={onNavigate}>
          Inbox
        </NavItem>
        <NavItem to="/app?mine=1" icon={<CircleUser className={icon} />} count={mineOpen} active={mineOn} onNavigate={onNavigate}>
          My issues
        </NavItem>
        <NavItem to="/app" icon={<LayoutList className={icon} />} active={pathname === '/app' && !mineOn && !cycleOn} onNavigate={onNavigate}>
          All issues
        </NavItem>
        <NavItem to="/app/board" icon={<Kanban className={icon} />} active={pathname === '/app/board' && !mineOn && !cycleOn} onNavigate={onNavigate}>
          Board
        </NavItem>
        <NavItem to="/app/insights" icon={<ChartColumn className={icon} />} active={pathname === '/app/insights'} onNavigate={onNavigate}>
          Insights
        </NavItem>
      </nav>
      <div className="mx-3 border-t border-line" />
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="px-2.5 pb-2 font-mono text-[11px] tracking-[0.12em] text-muted uppercase">Cycles</p>
        <nav aria-label="Cycles" className="flex flex-col gap-px">
          {cycles.map((c) => {
            const scoped = issues.filter((i) => i.cycleId === c.id)
            const done = scoped.filter((i) => CLOSED.includes(i.status)).length
            const pct = scoped.length ? done / scoped.length : 0
            return (
              <NavItem
                key={c.id}
                to={`/app?cycle=${c.id}`}
                active={cycleOn === c.id}
                onNavigate={onNavigate}
                icon={
                  <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
                    <circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--c-line-strong)" strokeWidth="1.5" />
                    <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray={`${pct * 40.8} 40.8`} transform="rotate(-90 8 8)" />
                  </svg>
                }
                count={scoped.length}
              >
                {c.name}
              </NavItem>
            )
          })}
        </nav>
        {cycles.length === 0 && (
          <p className="flex items-center gap-2 px-2.5 text-xs text-muted">
            <Repeat className="size-3.5" aria-hidden /> No cycles yet
          </p>
        )}
      </div>
      <div className="border-t border-line p-3">
        <NavItem to="/app/settings" icon={<Settings className={icon} />} active={pathname === '/app/settings'} onNavigate={onNavigate}>
          Settings
        </NavItem>
        <div className="mt-2 flex items-center gap-2.5 px-2.5 py-1.5">
          <Avatar member={me} size="sm" />
          <span className="flex-1 truncate text-[13px] text-muted">{me?.name}</span>
          <Link to="/" className="inline-flex min-h-8 items-center text-xs text-muted hover:text-fg" onClick={onNavigate}>
            Site
          </Link>
        </div>
      </div>
    </div>
  )
}
