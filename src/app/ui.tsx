import { createContext, useContext } from 'react'

import type { IssueDraft } from './store'
import type { Filters } from './store'

export type Grouping = 'status' | 'priority' | 'assignee' | 'none'
export type Prefs = { grouping: Grouping; collapsed: string[]; showClosed: boolean }

export type AppUI = {
  openCreate: (defaults?: Partial<IssueDraft>) => void
  openPalette: () => void
  openEdit: (n: number) => void
  openIssue: (n: number | null) => void
  selected: number | null
  filters: Filters
  setFilters: (f: Filters | ((f: Filters) => Filters)) => void
  prefs: Prefs
  setPrefs: (p: Partial<Prefs>) => void
  openNav: () => void
}

export const UICtx = createContext<AppUI | null>(null)

export function useUI() {
  const ctx = useContext(UICtx)
  if (!ctx) throw new Error('useUI outside TrackerApp')
  return ctx
}

/** True when the event target is a text field, so single-key shortcuts should not fire. */
export function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (!t) return false
  return t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || !!t.closest('[role="dialog"]')
}
