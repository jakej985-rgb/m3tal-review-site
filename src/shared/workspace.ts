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
