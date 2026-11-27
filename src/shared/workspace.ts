/*
  The workspace shape, in one place. The Worker refuses to store anything this
  rejects and the client refuses to render anything it rejects, so a row that is
  saved is a row the tracker can load.

  Deliberately dependency-free: the Worker bundles this too, and it should not
  pull the demo seed data in with it. The closed sets that matter for rendering
  (the notice kinds) are listed here; status, language and priority stay plain
  strings, since an unknown one renders as an unknown label rather than crashing.
*/

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isString = (v: unknown): v is string => typeof v === 'string'
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString)
const isOptionalString = (v: unknown) => v === null || isString(v)
const isOptionalNumber = (v: unknown) => v === null || isNumber(v)

/** Bigger than any workspace the tracker will produce, small enough to stay cheap. */
export const MAX_ISSUES = 2000

const NOTICE_KINDS = ['assigned', 'comment', 'status', 'mention']

const isComment = (v: unknown) =>
  isRecord(v) && isString(v.id) && isString(v.authorId) && isString(v.body) && isNumber(v.createdAt)

const isIssue = (v: unknown) =>
  isRecord(v) &&
  isNumber(v.number) &&
  isString(v.title) &&
  isString(v.description) &&
  isString(v.status) &&
  isNumber(v.priority) &&
  isString(v.lang) &&
  isOptionalString(v.assigneeId) &&
  // `IssueRow` calls `labelIds.includes()`, so a missing array crashes the page.
  isStringArray(v.labelIds) &&
  isOptionalString(v.cycleId) &&
  isOptionalString(v.due) &&
  isNumber(v.createdAt) &&
  isNumber(v.updatedAt) &&
  isOptionalNumber(v.completedAt) &&
  Array.isArray(v.comments) &&
  v.comments.every(isComment)

const isMember = (v: unknown) => isRecord(v) && isString(v.id) && isString(v.name) && isString(v.handle) && isNumber(v.hue)
const isLabel = (v: unknown) => isRecord(v) && isString(v.id) && isString(v.name) && isString(v.color)
const isCycle = (v: unknown) => isRecord(v) && isString(v.id) && isString(v.name) && isString(v.start) && isString(v.end)
const isNotice = (v: unknown) =>
  isRecord(v) &&
  isString(v.id) &&
  isNumber(v.issueNumber) &&
  isString(v.actorId) &&
  isString(v.kind) &&
  NOTICE_KINDS.includes(v.kind) &&
  isString(v.text) &&
  isNumber(v.createdAt) &&
  typeof v.read === 'boolean'

export function isWorkspace(value: unknown): boolean {
  if (!isRecord(value) || value.version !== 1) return false
  if (!Array.isArray(value.issues) || value.issues.length > MAX_ISSUES || !value.issues.every(isIssue)) return false
  if (!Array.isArray(value.members) || !value.members.every(isMember)) return false
  if (!Array.isArray(value.labels) || !value.labels.every(isLabel)) return false
  if (!Array.isArray(value.cycles) || !value.cycles.every(isCycle)) return false
  if (!Array.isArray(value.notices) || !value.notices.every(isNotice)) return false
  return isString(value.workspace) && isString(value.meId) && isNumber(value.nextNumber)
}

/* ------------------------------------------------------------------ */
/* Merging two copies                                                  */
/* ------------------------------------------------------------------ */

const json = (v: unknown) => JSON.stringify(v)

/** The parts of a workspace the merge works on: the scalars and the five keyed lists. */
export type WorkspaceLists = {
  workspace: string
  meId: string
  nextNumber: number
  issues: { number: number }[]
  members: { id: string }[]
  labels: { id: string }[]
  cycles: { id: string }[]
  notices: { id: string }[]
}

/**
  Per-entry three-way merge: an entry this tab changed since `base` is kept as it
  is here (including a deletion), and every other entry comes from `incoming`.
  Entries only the other side has are appended.
*/
function mergeBy<T>(base: T[], local: T[], incoming: T[], keyOf: (x: T) => string | number): T[] {
  const baseByKey = new Map(base.map((x) => [keyOf(x), x]))
  const localByKey = new Map(local.map((x) => [keyOf(x), x]))
  const incomingByKey = new Map(incoming.map((x) => [keyOf(x), x]))
  const merged: T[] = []
  const seen = new Set<string | number>()
  for (const key of [...localByKey.keys(), ...baseByKey.keys()]) {
    if (seen.has(key)) continue
    seen.add(key)
    // Unchanged here means the other side owns it, including when it deleted it.
    const chosen = json(localByKey.get(key)) === json(baseByKey.get(key)) ? incomingByKey.get(key) : localByKey.get(key)
    if (chosen) merged.push(chosen)
  }
  for (const item of incoming) {
    if (!seen.has(keyOf(item))) merged.push(item)
  }
  return merged
}

/**
  Merge this tab's unsaved work onto the workspace another tab or device saved.
  Neither side is thrown away: entries changed here win, everything else is the
  newer copy's, and scalars this tab did not touch come from `incoming`.
*/
export function mergeWorkspace<T extends WorkspaceLists>(base: T, local: T, incoming: T): T {
  const pick = <K extends keyof T>(field: K) => (json(local[field]) === json(base[field]) ? incoming[field] : local[field])
  return {
    ...incoming,
    issues: mergeBy(base.issues, local.issues, incoming.issues, (i) => i.number),
    members: mergeBy(base.members, local.members, incoming.members, (m) => m.id),
    labels: mergeBy(base.labels, local.labels, incoming.labels, (l) => l.id),
    cycles: mergeBy(base.cycles, local.cycles, incoming.cycles, (c) => c.id),
    notices: mergeBy(base.notices, local.notices, incoming.notices, (n) => n.id),
    workspace: pick('workspace') as string,
    meId: pick('meId') as string,
    // Issue numbers are handed out here, so the higher counter keeps them unique.
    nextNumber: Math.max(local.nextNumber, incoming.nextNumber),
  } as T
}
