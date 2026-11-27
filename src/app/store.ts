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
  The data layer. One state object. Signed out it is the browser-only demo in
  localStorage under `m3tal-review:v1`; signed in it is the account's workspace
  in D1, read from and written to /api/state. Every mutation goes through
  `update`, which persists (local or remote) and notifies.
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

const KEY = 'm3tal-review:v1'
// Set when a save is refused for a dead session: on the next sign-in this copy is
// replayed to the account instead of the account copy replacing it.
const RESUME_KEY = 'm3tal-review:resume'

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
  if (remote) {
    scheduleSync()
  } else {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* quota or private mode: keep working in memory */
    }
  }
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  // Another tab changed the data: pick it up.
  window.addEventListener('storage', (e) => {
    if (remote || e.key !== KEY) return
    state = load()
    listeners.forEach((l) => l())
  })
}

/* ------------------------------------------------------------------ */
/* Accounts and remote persistence                                     */
/* ------------------------------------------------------------------ */

export type SessionUser = { sub: string; name: string | null; email: string | null; picture: string | null }

type AuthState = { user: SessionUser | null; ready: boolean; remote: boolean; error: string | null; available: boolean; expired: boolean }

let session: SessionUser | null = null
let authReady = false
let remote = false
let signInAvailable = false
let syncError: string | null = null
// Set when a save is refused because the session is gone: the visitor has to sign in again.
let sessionExpired = false
let authSnapshot: AuthState = { user: null, ready: false, remote: false, error: null, available: false, expired: false }
let bootstrapped: Promise<void> | null = null
let syncTimer: ReturnType<typeof setTimeout> | undefined
// The `updatedAt` this tab last saw: saves are rejected if the row moved on.
let remoteUpdatedAt: number | null = null
let pendingSave = false
let saveInFlight = false
// True while the save in flight is the replay of the browser copy kept at expiry.
let resuming = false

type Resume = { sub: string; baseUpdatedAt: number | null }

function readResume(): Resume | null {
  try {
    const raw = localStorage.getItem(RESUME_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Resume
    return typeof parsed?.sub === 'string' ? parsed : null
  } catch {
    return null
  }
}

function writeResume(record: Resume | null) {
  try {
    if (record) localStorage.setItem(RESUME_KEY, JSON.stringify(record))
    else localStorage.removeItem(RESUME_KEY)
  } catch {
    /* storage unavailable: the in-memory copy is all there is */
  }
}

function refreshAuth() {
  authSnapshot = { user: session, ready: authReady, remote, error: syncError, available: signInAvailable, expired: sessionExpired }
  listeners.forEach((l) => l())
}

/** The signed-in visitor, whether their workspace is the remote one, and sync trouble. */
export function useAuth(): AuthState {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => authSnapshot,
    () => authSnapshot,
  )
}

/** Reads the session and, when signed in, replaces the local demo with the account's workspace. */
export function bootstrapAuth(): Promise<void> {
  bootstrapped ??= (async () => {
    try {
      const res = await fetch('/api/me', { headers: { accept: 'application/json' }, credentials: 'same-origin' })
      const body = res.ok ? ((await res.json()) as { user: SessionUser | null; available?: boolean }) : { user: null, available: false }
      session = body.user ?? null
      signInAvailable = body.available === true
      remote = !!session
      if (session) {
        const saved = await fetch('/api/state', { headers: { accept: 'application/json' }, credentials: 'same-origin' })
        if (saved.ok) {
          const payload = (await saved.json()) as { state: State | null; updatedAt: number | null }
          const kept = readResume()
          // A copy kept for a different account is not this account's work.
          if (kept && kept.sub !== session.sub) writeResume(null)
          const replay = kept && kept.sub === session.sub ? kept : null
          if (replay) {
            // Signed back in: push the copy kept at expiry before loading the account's.
            state = load()
            remoteUpdatedAt = replay.baseUpdatedAt
            resuming = true
            pendingSave = true
            void flushSave()
          } else if (payload.state && validState(payload.state)) {
            state = payload.state
            remoteUpdatedAt = payload.updatedAt ?? null
          } else {
            // First visit on this account: seed the demo workspace into it.
            state = fresh()
            remoteUpdatedAt = payload.updatedAt ?? null
            pendingSave = true
            void flushSave()
          }
        } else if (saved.status === 401) {
          session = null
          remote = false
        } else {
          syncError = 'Could not load the workspace saved to your account.'
        }
      }
    } catch {
      session = null
      remote = false
    } finally {
      authReady = true
      refreshAuth()
    }
  })()
  return bootstrapped
}

function scheduleSync(delay = 500) {
  if (!remote) return
  pendingSave = true
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => void flushSave(), delay)
}

/** Take the server's newer copy after a rejected save. */
function adoptServerCopy(
  next: unknown,
  updatedAt: number | null,
  message = 'This workspace changed in another tab or on another device, so its newer copy was loaded here.',
) {
  const same = JSON.stringify(next) === JSON.stringify(state)
  state = next && typeof next === 'object' && validState(next) ? next : fresh()
  remoteUpdatedAt = updatedAt
  pendingSave = false
  // A conflict over identical content is usually this tab's own pagehide write
  // landing late, so only say something when the copies really differ.
  syncError = same ? null : message
  refreshAuth()
}

function validState(value: unknown): value is State {
  const s = value as State
  return !!s && s.version === 1 && Array.isArray(s.issues)
}

/**
  The session died between page loads. Stop writing, keep the visitor's unsaved
  work in this browser, and ask them to sign in again rather than retrying a
  save that cannot succeed.
*/
function expireSession() {
  const owner = session?.sub ?? null
  sessionExpired = true
  session = null
  remote = false
  authReady = true
  pendingSave = false
  resuming = false
  if (syncTimer) clearTimeout(syncTimer)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* quota or private mode: the in-memory copy is still there */
  }
  if (owner) writeResume({ sub: owner, baseUpdatedAt: remoteUpdatedAt })
  syncError = 'Your session expired, so this change is only saved in this browser. Sign in again to save it to your account.'
  refreshAuth()
}

/**
  One save at a time. Edits made while a save is in flight are coalesced into
  the next one, so two writes cannot be in flight out of order.
*/
async function flushSave() {
  if (!remote || saveInFlight || !pendingSave) return
  syncTimer = undefined
  pendingSave = false
  saveInFlight = true
  try {
    const res = await fetch('/api/state', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ state, baseUpdatedAt: remoteUpdatedAt }),
    })
    if (res.status === 401) {
      expireSession()
      return
    }
    if (res.status === 409) {
      const payload = (await res.json().catch(() => null)) as { state?: unknown; updatedAt?: number | null } | null
      const replaying = resuming
      resuming = false
      writeResume(null)
      adoptServerCopy(
        payload?.state ?? null,
        payload?.updatedAt ?? null,
        replaying
          ? 'Signed in, but this account changed while you were signed out, so the browser copy was not applied. It is still kept in this browser.'
          : undefined,
      )
      return
    }
    if (!res.ok) throw new Error(String(res.status))
    const payload = (await res.json().catch(() => null)) as { updatedAt?: number } | null
    if (typeof payload?.updatedAt === 'number') remoteUpdatedAt = payload.updatedAt
    if (resuming) {
      resuming = false
      writeResume(null)
    }
    if (syncError) {
      syncError = null
      refreshAuth()
    }
  } catch {
    // Not lost: the dirty flag stays set and the next edit retries.
    pendingSave = true
    syncError = 'Your last change is not saved to your account yet. It retries on the next edit.'
    refreshAuth()
  } finally {
    saveInFlight = false
    if (pendingSave && remote) {
      if (syncTimer) clearTimeout(syncTimer)
      syncTimer = setTimeout(() => void flushSave(), 400)
    }
  }
}

if (typeof window !== 'undefined') {
  // Leaving the page: only if something is unsaved, so no duplicate write.
  window.addEventListener('pagehide', () => {
    if (!remote || !pendingSave) return
    if (syncTimer) clearTimeout(syncTimer)
    void fetch('/api/state', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      keepalive: true,
      body: JSON.stringify({ state, baseUpdatedAt: remoteUpdatedAt }),
    })
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
// REV-GO-142: brand prefix, language of the code under review, issue number.
// A number with no issue behind it (just deleted) keeps the bare REV-142 form.
export const issueKey = (n: number) => {
  const lang = state.issues.find((i) => i.number === n)?.lang
  return lang ? `${BRAND.prefix}-${lang}-${n}` : `${BRAND.prefix}-${n}`
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export type IssueDraft = Pick<Issue, 'title' | 'description' | 'status' | 'priority' | 'lang' | 'assigneeId' | 'labelIds' | 'cycleId' | 'due'>

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
