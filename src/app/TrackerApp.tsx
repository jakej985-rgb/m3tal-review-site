import { useCallback, useEffect, useMemo, useState } from 'react'

import { Drawer } from '@/components/Drawer'
import { ToastProvider } from '@/components/Toast'
import { NotFound } from '@/sections/NotFound'
import { navigate, setQuery, useLocation } from '@/lib/router'
import { CommandPalette } from './CommandPalette'
import { Inbox } from './Inbox'
import { Insights } from './Insights'
import { IssueModal } from './IssueModal'
import { IssuesView } from './IssuesView'
import { Settings } from './Settings'
import { Sidebar } from './Sidebar'
import { EMPTY_FILTERS, type Filters, type IssueDraft } from './store'
import { type AppUI, isTyping, type Prefs, UICtx } from './ui'

const PREFS_KEY = 'triage:prefs'
const DEFAULT_PREFS: Prefs = { grouping: 'status', collapsed: [], showClosed: true }

function loadPrefs(): Prefs {
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs>) }
  } catch {
    return DEFAULT_PREFS
  }
}

export function TrackerApp() {
  const { pathname, search } = useLocation()
  const selectedRaw = search.get('issue')
  const selected = selectedRaw && /^\d+$/.test(selectedRaw) ? Number(selectedRaw) : null

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [prefs, setPrefsState] = useState<Prefs>(loadPrefs)
  const [modal, setModal] = useState<{ open: boolean; editing: number | null; defaults?: Partial<IssueDraft> }>({ open: false, editing: null })
  const [palette, setPalette] = useState(false)
  const [nav, setNav] = useState(false)

  const setPrefs = useCallback((p: Partial<Prefs>) => {
    setPrefsState((cur) => {
      const next = { ...cur, ...p }
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const openIssue = useCallback((n: number | null) => {
    const onIssuesPage = window.location.pathname === '/app' || window.location.pathname === '/app/board'
    if (n !== null && !onIssuesPage) navigate(`/app?issue=${n}`)
    else setQuery('issue', n === null ? null : String(n))
  }, [])

  const openCreate = useCallback((defaults?: Partial<IssueDraft>) => setModal({ open: true, editing: null, defaults }), [])
  const openPalette = useCallback(() => setPalette(true), [])
  const openEdit = useCallback((n: number) => setModal({ open: true, editing: n }), [])

  // Global shortcuts: ⌘K palette, c create.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((p) => !p)
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e)) return
      if (e.key === 'c') {
        e.preventDefault()
        openCreate()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openCreate])

  useEffect(() => {
    document.title = `${pathname === '/app/inbox' ? 'Inbox' : pathname === '/app/insights' ? 'Insights' : pathname === '/app/settings' ? 'Settings' : pathname === '/app/board' ? 'Board' : 'Issues'} · Triage`
  }, [pathname])

  const ui = useMemo<AppUI>(
    () => ({ openCreate, openPalette, openEdit, openIssue, selected, filters, setFilters, prefs, setPrefs, openNav: () => setNav(true) }),
    [openCreate, openPalette, openEdit, openIssue, selected, filters, prefs, setPrefs],
  )

  let page: React.ReactNode
  if (pathname === '/app') page = <IssuesView view="list" />
  else if (pathname === '/app/board') page = <IssuesView view="board" />
  else if (pathname === '/app/inbox') page = <Inbox />
  else if (pathname === '/app/insights') page = <Insights />
  else if (pathname === '/app/settings') page = <Settings />
  else page = <NotFound inApp />

  return (
    <UICtx.Provider value={ui}>
      <ToastProvider>
        <div className="flex h-dvh overflow-hidden bg-bg text-fg">
          <aside aria-label="Sidebar" className="hidden w-[232px] shrink-0 border-r border-line bg-bg md:block">
            <Sidebar />
          </aside>
          <main className="min-w-0 flex-1">{page}</main>
        </div>
        <Drawer open={nav} onClose={() => setNav(false)} title="Navigation" side="left" width={280}>
          <Sidebar onNavigate={() => setNav(false)} />
        </Drawer>
        <IssueModal
          open={modal.open}
          editing={modal.editing}
          defaults={modal.defaults}
          onClose={() => setModal((m) => ({ ...m, open: false }))}
          onCreated={(n) => openIssue(n)}
        />
        <CommandPalette open={palette} onClose={() => setPalette(false)} onCreate={openCreate} onOpenIssue={openIssue} />
      </ToastProvider>
    </UICtx.Provider>
  )
}
