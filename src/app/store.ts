import { useSyncExternalStore } from 'react'

import {
  BRAND,
  CLOSED,
  type Comment,
  type Cycle,
  type Issue,
  type Label,
  ME,
  type Member,
  type Notice,
  type PriorityId,
  type StatusId,
  SEED_LABELS,
  SEED_MEMBERS,
  seedCycles,
  seedIssues,
  seedNotices,
  STATUSES,
} from '@/data'

/*
  The data layer. One state object, persisted to localStorage under
  `triage:v1`. Every mutation goes through `update`, which saves and notifies.
  To move to D1, replace `load` with a fetch and make each action below call
  an API route in src/worker/index.ts (the shapes are already serialisable).
*/

export type State = {
  version: 1
  workspace: string
  meId: string
  nextNumber: number
  issues: Issue[]
  members: Member[]
  labels: Label[]
  cycles: Cycle[]
  notices: Notice[]
}

const KEY = 'triage:v1'

function fresh(): State {
  const issues = seedIssues()
  return {
    version: 1,
    workspace: BRAND.workspace,
    meId: ME,
    nextNumber: Math.max(...issues.map((i) => i.number)) + 1,
    issues,
    members: SEED_MEMBERS,
    labels: SEED_LABELS,
    cycles: seedCycles(),
    notices: seedNotices(),
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as State
      if (parsed.version === 1 && Array.isArray(parsed.issues)) return parsed
    }
  } catch {
    /* corrupt or blocked storage: start fresh */
  }
  return fresh()
}

let state: State = typeof window === 'undefined' ? fresh() : load()
const listeners = new Set<() => void>()

function update(fn: (s: State) => State) {
  state = fn(state)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* quota or private mode: keep working in memory */
  }
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  // Another tab changed the data: pick it up.
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return
    state = load()
    listeners.forEach((l) => l())
  })
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => select(state),
    () => select(state),
  )
}

export const getState = () => state

const uid = () => Math.random().toString(36).slice(2, 10)
export const issueKey = (n: number) => `${BRAND.prefix}-${n}`

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export type IssueDraft = Pick<Issue, 'title' | 'description' | 'status' | 'priority' | 'assigneeId' | 'labelIds' | 'cycleId' | 'due'>

export function createIssue(draft: IssueDraft): number {
  const number = state.nextNumber
  const now = Date.now()
  update((s) => ({
    ...s,
    nextNumber: s.nextNumber + 1,
    issues: [
      {
        ...draft,
        number,
        createdAt: now,
        updatedAt: now,
        completedAt: CLOSED.includes(draft.status) ? now : null,
        comments: [],
      },
      ...s.issues,
    ],
  }))
  return number
}

export function patchIssue(number: number, patch: Partial<IssueDraft>) {
  if (!state.issues.some((i) => i.number === number)) return
  const now = Date.now()
  update((s) => {
    const issues = s.issues.map((i) => {
      if (i.number !== number) return i
      const next = { ...i, ...patch, updatedAt: now }
      if (patch.status && patch.status !== i.status) {
        next.completedAt = CLOSED.includes(patch.status) ? now : null
      }
      return next
    })
    return { ...s, issues }
  })
}

export function deleteIssue(number: number) {
  update((s) => ({
    ...s,
    issues: s.issues.filter((i) => i.number !== number),
    notices: s.notices.filter((n) => n.issueNumber !== number),
  }))
}

export function restoreIssue(issue: Issue) {
  update((s) => ({ ...s, issues: [issue, ...s.issues].sort((a, b) => b.number - a.number) }))
}

export function addComment(number: number, body: string) {
  const c: Comment = { id: uid(), authorId: state.meId, body, createdAt: Date.now() }
  update((s) => ({
    ...s,
    issues: s.issues.map((i) => (i.number === number ? { ...i, comments: [...i.comments, c], updatedAt: c.createdAt } : i)),
  }))
  // Demo only: the assignee "replies" a moment later so the inbox has
  // something to show. Delete this block when comments come from a server.
  const issue = state.issues.find((i) => i.number === number)
  const replier = issue?.assigneeId && issue.assigneeId !== state.meId ? issue.assigneeId : null
  if (replier) {
    window.setTimeout(() => {
      if (!state.issues.some((i) => i.number === number)) return
      const reply: Comment = { id: uid(), authorId: replier, body: 'Thanks, taking a look now.', createdAt: Date.now() }
      update((s) => ({
        ...s,
        issues: s.issues.map((i) => (i.number === number ? { ...i, comments: [...i.comments, reply] } : i)),
        notices: [
          { id: uid(), issueNumber: number, actorId: replier, kind: 'comment', text: `replied: "${reply.body}"`, createdAt: reply.createdAt, read: false },
          ...s.notices,
        ],
      }))
    }, 2500)
  }
}

export function deleteComment(number: number, id: string) {
  update((s) => ({
    ...s,
    issues: s.issues.map((i) => (i.number === number ? { ...i, comments: i.comments.filter((c) => c.id !== id) } : i)),
  }))
}

export function markNotice(id: string, read: boolean) {
  update((s) => ({ ...s, notices: s.notices.map((n) => (n.id === id ? { ...n, read } : n)) }))
}
export function markAllNotices() {
  update((s) => ({ ...s, notices: s.notices.map((n) => ({ ...n, read: true })) }))
}
export function deleteNotice(id: string) {
  update((s) => ({ ...s, notices: s.notices.filter((n) => n.id !== id) }))
}

export function addLabel(name: string, color: string) {
  const id = uid()
  update((s) => ({ ...s, labels: [...s.labels, { id, name, color }] }))
  return id
}
export function patchLabel(id: string, patch: Partial<Omit<Label, 'id'>>) {
  update((s) => ({ ...s, labels: s.labels.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))
}
export function removeLabel(id: string) {
  update((s) => ({
    ...s,
    labels: s.labels.filter((l) => l.id !== id),
    issues: s.issues.map((i) => (i.labelIds.includes(id) ? { ...i, labelIds: i.labelIds.filter((x) => x !== id) } : i)),
  }))
}

export function addMember(name: string) {
  const handle = name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'teammate'
  const hue = Math.floor(Math.random() * 360)
  const id = uid()
  update((s) => ({ ...s, members: [...s.members, { id, name: name.trim(), handle, hue }] }))
  return id
}
export function removeMember(id: string) {
  update((s) => ({
    ...s,
    members: s.members.filter((m) => m.id !== id),
    issues: s.issues.map((i) => (i.assigneeId === id ? { ...i, assigneeId: null } : i)),
  }))
}

export function renameWorkspace(name: string) {
  update((s) => ({ ...s, workspace: name }))
}

export function resetDemo() {
  update(() => fresh())
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

export type Filters = {
  q: string
  status: StatusId[]
  priority: PriorityId[]
  assignee: string[] // member ids, or 'none'
  label: string[]
  cycle: string | null
  mine: boolean
}

export const EMPTY_FILTERS: Filters = { q: '', status: [], priority: [], assignee: [], label: [], cycle: null, mine: false }

export function filterIssues(issues: Issue[], f: Filters, meId: string) {
  const q = f.q.trim().toLowerCase()
  return issues.filter((i) => {
    if (f.mine && i.assigneeId !== meId) return false
    if (f.status.length && !f.status.includes(i.status)) return false
    if (f.priority.length && !f.priority.includes(i.priority)) return false
    if (f.assignee.length && !f.assignee.includes(i.assigneeId ?? 'none')) return false
    if (f.label.length && !f.label.some((l) => i.labelIds.includes(l))) return false
    if (f.cycle && i.cycleId !== f.cycle) return false
    if (q && !(`${issueKey(i.number)} ${i.title}`.toLowerCase().includes(q))) return false
    return true
  })
}

export const activeFilterCount = (f: Filters) =>
  f.status.length + f.priority.length + f.assignee.length + f.label.length + (f.cycle ? 1 : 0)

export const statusOrder = (s: StatusId) => STATUSES.findIndex((x) => x.id === s)
const prioRank = (p: PriorityId) => (p === 0 ? 5 : p)

export function sortIssues(issues: Issue[]) {
  return [...issues].sort((a, b) => prioRank(a.priority) - prioRank(b.priority) || b.number - a.number)
}
