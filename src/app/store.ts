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
import { isWorkspace, mergeWorkspace } from '@/shared/workspace'

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
// A copy whose merge could not be saved: kept out of the way of `:v1`, which is
// what the replay and the signed-out demo read.
const KEPT_KEY = 'm3tal-review:kept'

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

/** The workspace stored in this browser, or null when there is none. */
function loadStored(): State | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as State
      if (parsed.version === 1 && Array.isArray(parsed.issues)) return parsed
    }
  } catch {
    /* corrupt or blocked storage */
  }
  return null
}

function load(): State {
  return loadStored() ?? fresh()
}

let state: State = typeof window === 'undefined' ? fresh() : load()
const listeners = new Set<() => void>()

/** Keep a copy in this browser. Storage can be full or blocked; that is survivable. */
function persistLocal(next: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* quota or private mode: keep working in memory */
  }
}

type Kept = { savedAt: number; state: State }

function readKept(): Kept | null {
  try {
    const raw = localStorage.getItem(KEPT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Kept
    return parsed && typeof parsed.savedAt === 'number' && parsed.state ? parsed : null
  } catch {
    return null
  }
}

// A copy the merge gave up on, waiting for the visitor to restore or discard it.
let keptRecord: Kept | null = typeof window === 'undefined' ? null : readKept()
let keptInfo: { savedAt: number } | null = keptRecord ? { savedAt: keptRecord.savedAt } : null

function forgetKept() {
  keptRecord = null
  keptInfo = null
  try {
    localStorage.removeItem(KEPT_KEY)
  } catch {
    /* storage unavailable: the in-memory record is all there was */
  }
}

/**
  Park a copy the merge gave up on, so the visitor can put it back. It is not
  replayed on its own: the account's copy already won.
*/
function keepDiscardedCopy(discarded: State) {
  keptRecord = { savedAt: Date.now(), state: discarded }
  keptInfo = { savedAt: keptRecord.savedAt }
  try {
    localStorage.setItem(KEPT_KEY, JSON.stringify(keptRecord))
  } catch {
    /* storage full or blocked: this tab still has it */
  }
}

function update(fn: (s: State) => State) {
  state = fn(state)
  if (remote) scheduleSync()
  else persistLocal(state)
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

export type SessionUser = { sub: string; name: string | null; email: string | null }

type AuthState = { user: SessionUser | null; ready: boolean; error: string | null; available: boolean; expired: boolean }

let session: SessionUser | null = null
let authReady = false
let remote = false
let signInAvailable = false
let syncError: string | null = null
// Set when a save is refused because the session is gone: the visitor has to sign in again.
let sessionExpired = false
let authSnapshot: AuthState = { user: null, ready: false, error: null, available: false, expired: false }
let bootstrapped: Promise<void> | null = null
let syncTimer: ReturnType<typeof setTimeout> | undefined
// The `updatedAt` this tab last saw: saves are rejected if the row moved on.
let remoteUpdatedAt: number | null = null
let pendingSave = false
let saveInFlight = false
// True while the save in flight is the replay of the browser copy kept at expiry.
let resuming = false
// The copy the server last acknowledged. A rejected save is merged against this,
// not against the copy that was sent, so the entries this tab changed are exactly
// the ones it keeps — including in a copy the server refused.
let synced: State = state
// How many merges in a row this tab has produced, so a busy workspace cannot loop.
let mergeRounds = 0
const MAX_MERGE_ROUNDS = 3

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

/** A replay is over: forget the kept copy and stop tagging conflicts as replays. */
function endReplay() {
  resuming = false
  writeResume(null)
}

function refreshAuth() {
  authSnapshot = { user: session, ready: authReady, error: syncError, available: signInAvailable, expired: sessionExpired }
  listeners.forEach((l) => l())
}

/** One subscription helper for both stores below. */
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** The signed-in visitor, and any trouble syncing their workspace. */
export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, () => authSnapshot, () => authSnapshot)
}

/** A copy the merge gave up on, waiting for the visitor to decide what to do with it. */
export function useKeptCopy() {
  return useSyncExternalStore(subscribe, () => keptInfo, () => keptInfo)
}

/** Put the parked edits back on screen, and save them over the account's copy. */
export function restoreKeptCopy() {
  if (!keptRecord) return
  const restored = keptRecord.state
  forgetKept()
  state = restored
  syncError = null
  if (remote) {
    pendingSave = true
    mergeRounds = 0
    if (syncTimer) clearTimeout(syncTimer)
    void flushSave()
  } else {
    persistLocal(state)
  }
  refreshAuth()
}

/** Leave the account's copy as it is and forget the parked edits. */
export function discardKeptCopy() {
  if (!keptRecord) return
  forgetKept()
  syncError = null
  refreshAuth()
}

/** Reads the session and, when signed in, replaces the local demo with the account's workspace. */
export function bootstrapAuth(): Promise<void> {
  bootstrapped ??= (async () => {
    try {
      const res = await fetch('/api/me', { headers: { accept: 'application/json' }, credentials: 'same-origin' })
      const body = res.ok ? ((await res.json()) as { user: SessionUser | null; available?: boolean }) : { user: null, available: false }
      session = body.user ?? null
      signInAvailable = body.available === true
      if (session) {
        const saved = await fetch('/api/state', { headers: { accept: 'application/json' }, credentials: 'same-origin' })
        if (saved.ok) {
          const payload = (await saved.json()) as { state: State | null; updatedAt: number | null }
          const kept = readResume()
          const replay = kept?.sub === session.sub ? kept : null
          // Only a copy that is really in this browser may be replayed, and only
          // for the account that kept it: with no stored workspace there is
          // nothing to send back, and uploading a fresh demo would bury the
          // account's own copy.
          const keptState = replay ? loadStored() : null
          if (kept && (!replay || !keptState)) writeResume(null)
          // Remote writes stay off until the account's workspace is in hand, so a
          // slow load cannot turn this tab's demo into a save.
          remote = true
          // What the server holds right now: the base a later conflict merges onto.
          synced = payload.state && validState(payload.state) ? payload.state : fresh()
          if (replay && keptState) {
            // Signed back in: push the copy kept at expiry before loading the account's.
            state = keptState
            remoteUpdatedAt = replay.baseUpdatedAt
            resuming = true
            pendingSave = true
            void flushSave()
          } else {
            remoteUpdatedAt = payload.updatedAt ?? null
            if (payload.state && validState(payload.state)) {
              state = payload.state
            } else {
              // First visit on this account: seed the demo workspace into it.
              state = fresh()
              pendingSave = true
              void flushSave()
            }
          }
        } else if (saved.status === 401) {
          session = null
        } else {
          syncError = 'Could not load the workspace saved to your account.'
        }
      }
    } catch {
      session = null
    } finally {
      remote = !!session
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

const CONFLICT = 'This workspace changed in another tab or on another device, so its newer copy was loaded here.'
const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
  Take the server's newer copy after a rejected save. Edits this tab made after
  sending its copy are merged onto the newer one and queued, and so is a merged
  copy that is itself rejected — neither is thrown away or written over blind.
*/
function adoptServerCopy(next: unknown, updatedAt: number | null, opts: { sent?: State; message?: string } = {}) {
  const incoming = next && validState(next) ? next : fresh()
  // A conflict over identical content is usually this tab's own pagehide write
  // landing late, so only say something when the copies really differ.
  const sameContent = sameJson(incoming, state)
  remoteUpdatedAt = updatedAt
  // Nothing to merge when this tab is back in step with the last acknowledged copy.
  const changedHere = !!opts.sent && !sameJson(synced, state)
  if (changedHere && mergeRounds < MAX_MERGE_ROUNDS) {
    state = mergeWorkspace(synced, state, incoming)
    mergeRounds += 1
    // The merged copy is not on the server yet: keep it dirty so it is saved
    // against the newer base instead of sitting in memory.
    pendingSave = true
    syncError = 'This workspace changed in another tab or on another device. Your edits were merged with its newer copy.'
  } else {
    const exhausted = changedHere
    // The merged copy cannot be sent again, so park it before the newer copy takes
    // the screen: otherwise the edits that lost exist only in memory.
    if (exhausted) keepDiscardedCopy(state)
    state = incoming
    pendingSave = false
    mergeRounds = 0
    syncError = sameContent
      ? null
      : exhausted
        ? 'This workspace kept changing in another tab or on another device, so its newest copy was loaded. The edits that could not be saved are kept in this browser, under m3tal-review:kept — restore or discard them below.'
        : (opts.message ?? CONFLICT)
  }
  // The server's copy is authoritative from here on, for the next merge and for
  // the diff that decides what this tab changed.
  synced = incoming
  refreshAuth()
}

function validState(value: unknown): value is State {
  return isWorkspace(value)
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
  pendingSave = false
  resuming = false
  mergeRounds = 0
  if (syncTimer) clearTimeout(syncTimer)
  persistLocal(state)
  if (owner) writeResume({ sub: owner, baseUpdatedAt: remoteUpdatedAt })
  syncError = 'Your session expired, so this change is only saved in this browser. Sign in again to save it to your account.'
  refreshAuth()
}

/** The one PUT this app makes: the debounced save and the pagehide flush share it. */
function putState(keepalive: boolean, body: State) {
  return fetch('/api/state', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    keepalive,
    body: JSON.stringify({ state: body, baseUpdatedAt: remoteUpdatedAt }),
  })
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
  const sent = state
  let failed = false
  try {
    const res = await putState(false, sent)
    if (res.status === 401) {
      expireSession()
      return
    }
    if (res.status === 409) {
      const payload = (await res.json().catch(() => null)) as { state?: unknown; updatedAt?: number | null } | null
      const replaying = resuming
      if (replaying) endReplay()
      adoptServerCopy(payload?.state ?? null, payload?.updatedAt ?? null, {
        // A replay keeps the documented rule instead: the account's copy wins and
        // the browser copy stays in storage, so it is not merged into the account.
        sent: replaying ? undefined : sent,
        message: replaying
          ? 'Signed in, but this account changed while you were signed out, so the browser copy was not applied. It is still kept in this browser.'
          : undefined,
      })
      return
    }
    if (!res.ok) throw new Error(String(res.status))
    const payload = (await res.json().catch(() => null)) as { updatedAt?: number } | null
    if (typeof payload?.updatedAt === 'number') remoteUpdatedAt = payload.updatedAt
    if (resuming) endReplay()
    // The server has this copy now: it is the base a later conflict is measured against.
    synced = sent
    mergeRounds = 0
    if (syncError) {
      syncError = null
      refreshAuth()
    }
  } catch {
    // Not lost: the dirty flag stays set and the next edit retries. Scheduling a
    // retry here would resend a body the server already refused (400, 413) forever.
    failed = true
    pendingSave = true
    syncError = 'Your last change is not saved to your account yet. It retries on the next edit.'
    refreshAuth()
  } finally {
    saveInFlight = false
    // Coalesced edits from during the save go out next, through the same one-at-a-time path.
    if (pendingSave && !failed) scheduleSync(400)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', (event) => {
    // Back/forward cache: the page is frozen rather than gone, so keep the save
    // queued instead of spending it now and losing it on restore.
    if (event.persisted || !remote) return
    if (!pendingSave && !saveInFlight) return
    // Keep a copy before the request. A save already in flight may win, and the
    // next page load replays what is here rather than dropping the last edits.
    persistLocal(state)
    if (session) writeResume({ sub: session.sub, baseUpdatedAt: remoteUpdatedAt })
    if (syncTimer) clearTimeout(syncTimer)
    void putState(true, state)
  })

  window.addEventListener('pageshow', (event) => {
    // Restored from the back/forward cache: the timer went with the page, so
    // anything still queued needs a new one.
    if (event.persisted && remote && pendingSave) scheduleSync(0)
  })
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state))
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
  const label = state.labels.find((l) => l.id === id) ?? null
  const affected = state.issues.filter((i) => i.labelIds.includes(id)).map((i) => i.number)
  update((s) => ({
    ...s,
    labels: s.labels.filter((l) => l.id !== id),
    issues: s.issues.map((i) => (i.labelIds.includes(id) ? { ...i, labelIds: i.labelIds.filter((x) => x !== id) } : i)),
  }))
  // Returned so the caller can undo it: a new label would have a new id, which
  // none of the issues would point at.
  return label ? { label, affected } : null
}

/** Put a deleted label back under its original id, with the issues it was on. */
export function restoreLabel(removed: { label: Label; affected: number[] }) {
  update((s) => ({
    ...s,
    labels: [...s.labels, removed.label],
    issues: s.issues.map((i) =>
      removed.affected.includes(i.number) && !i.labelIds.includes(removed.label.id) ? { ...i, labelIds: [...i.labelIds, removed.label.id] } : i,
    ),
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
