/*
  Drives the real store against a stubbed browser and a scripted /api/state, to
  check the one thing the merge unit tests cannot: that a merge produced by a 409
  is actually sent back to the server instead of being left in memory.
*/

import { expect, test } from 'bun:test'

// The store is a module-level singleton that reads window/localStorage on import,
// so those stubs have to exist before it is loaded.
const memory = new Map<string, string>()
;(globalThis as any).localStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, String(v)),
  removeItem: (k: string) => void memory.delete(k),
  clear: () => memory.clear(),
  key: (i: number) => [...memory.keys()][i] ?? null,
  get length() {
    return memory.size
  },
}
;(globalThis as any).window = { addEventListener: () => {} }

type Workspace = { issues: { number: number; title: string }[]; nextNumber: number }
type PutBody = { state: Workspace; baseUpdatedAt: number | null }

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

let accountCopy: unknown = null
const puts: PutBody[] = []
const replies: (() => Response | Promise<Response>)[] = []
// Whose session the next page load gets; the scope test signs in as someone else.
let meSub = 'u1'

;(globalThis as any).fetch = async (input: unknown, init?: { method?: string; body?: unknown }) => {
  const url = String(input)
  const method = init?.method ?? 'GET'
  if (url.endsWith('/api/me')) return json({ available: true, user: { sub: meSub, name: 'Tess', email: null } })
  if (url.endsWith('/api/state') && method === 'GET') return json({ state: accountCopy, updatedAt: 100 })
  if (url.endsWith('/api/state') && method === 'PUT') {
    puts.push(JSON.parse(String(init?.body)) as PutBody)
    const reply = replies.shift()
    return reply ? reply() : json({ ok: true, updatedAt: 9_000 })
  }
  throw new Error(`unexpected request ${method} ${url}`)
}

/** Hold the next save open, so an edit can land while it is in flight. */
const holdNextPut = () => {
  let release: (res: Response) => void = () => {}
  replies.push(() => new Promise<Response>((resolve) => (release = resolve)))
  return (res: Response) => release(res)
}

const waitFor = async (done: () => boolean, ms = 4_000) => {
  const started = Date.now()
  while (!done()) {
    if (Date.now() - started > ms) throw new Error('timed out waiting for the store')
    await new Promise((r) => setTimeout(r, 20))
  }
}

const draft = (title: string) => ({
  title,
  description: '',
  status: 'todo' as const,
  priority: 3 as const,
  lang: 'TS' as const,
  assigneeId: null,
  labelIds: [],
  cycleId: null,
  due: null,
})

/** What another tab saved on top of `base`, with its own issue added at `number`. */
const elsewhere = (base: Workspace, title: string, updatedAt: number, number: number) => ({
  state: { ...base, issues: [{ ...base.issues[0], number, title }, ...base.issues] },
  updatedAt,
})

const titles = (state: Workspace) => state.issues.map((i) => i.title)
// Parked copies are filed per account; this suite signs in as `u1`.
const keptKey = (sub = 'u1') => `m3tal-review:kept:${sub}`
const keptStored = () => memory.get(keptKey())

test('a merged workspace is re-saved after a 409 instead of being dropped', async () => {
  const store = await import('../src/app/store')
  accountCopy = store.getState()
  await store.bootstrapAuth()
  expect(puts.length).toBe(0)

  const releaseFirst = holdNextPut()
  store.createIssue(draft('Mine A'))
  await waitFor(() => puts.length === 1)

  // Edited while that save is in flight: the copy that comes back rejected no
  // longer matches what was sent, so the two have to be merged.
  store.createIssue(draft('Mine B'))
  const conflict = elsewhere(accountCopy as Workspace, 'Theirs', 200, 9_001)
  releaseFirst(json({ conflict: true, ...conflict }, 409))

  await waitFor(() => puts.length === 2)
  const resent = puts[1]
  expect(resent.baseUpdatedAt).toBe(200)
  expect(titles(resent.state)).toContain('Mine A')
  expect(titles(resent.state)).toContain('Mine B')
  expect(titles(resent.state)).toContain('Theirs')
  // Nothing is left queued: the merged copy is on the server and on screen.
  await waitFor(() => titles(store.getState() as Workspace).includes('Theirs'))
  expect(titles(store.getState() as Workspace)).toContain('Mine B')
})

test('a merged copy rejected a second time is merged again, not discarded', async () => {
  const store = await import('../src/app/store')
  const base = store.getState() as Workspace

  const releaseThird = holdNextPut()
  replies.push(() => json({ conflict: true, ...elsewhere(base, 'Theirs again', 1_200, 9_003) }, 409))

  store.createIssue(draft('Mine C'))
  await waitFor(() => puts.length === 3)
  store.createIssue(draft('Mine D'))
  releaseThird(json({ conflict: true, ...elsewhere(base, 'Theirs second', 1_100, 9_002) }, 409))

  await waitFor(() => puts.length === 4)
  // The merged copy was rejected in turn; it has to come back merged onto the
  // newest base rather than being replaced by it.
  await waitFor(() => puts.length === 5)
  const finalPut = puts[4]
  expect(finalPut.baseUpdatedAt).toBe(1_200)
  expect(titles(finalPut.state)).toContain('Mine C')
  expect(titles(finalPut.state)).toContain('Mine D')
  expect(titles(finalPut.state)).toContain('Theirs again')
})

/** What another page load of the store gets: its own module state, same browser. */
const freshStore = async (tag: string) =>
  (await import(`../src/app/store?${tag}`)) as typeof import('../src/app/store')

/** Drive a copy through every merge round into the cap, so the store parks it. */
async function parkACopy(store: typeof import('../src/app/store'), tag: string, firstNumber: number) {
  const base = store.getState() as Workspace
  const start = puts.length
  const releaseFirst = holdNextPut()
  for (const [i, at] of [1_300, 1_400, 1_500].entries()) {
    replies.push(() => json({ conflict: true, ...elsewhere(base, `${tag} ${i + 2}`, at, firstNumber + i + 1) }, 409))
  }

  store.createIssue(draft(`${tag} A`))
  await waitFor(() => puts.length === start + 1)
  store.createIssue(draft(`${tag} B`))
  releaseFirst(json({ conflict: true, ...elsewhere(base, `${tag} 1`, 1_250, firstNumber) }, 409))

  await waitFor(() => puts.length === start + 4)
  const settled = puts.length
  await new Promise((r) => setTimeout(r, 600))
  // The cap stops the loop: nothing further is sent.
  expect(puts.length).toBe(settled)
}

test('a merge that hits the cap parks the copy instead of losing it', async () => {
  const store = await import('../src/app/store')
  await parkACopy(store, 'Cap', 9_010)

  // The copy that lost is parked in this browser, edits and all.
  const kept = JSON.parse(keptStored() ?? 'null') as { state: Workspace } | null
  expect(kept).not.toBeNull()
  expect(titles(kept!.state)).toContain('Cap A')
  expect(titles(kept!.state)).toContain('Cap B')
  // The account's newest copy is what the tab shows instead.
  expect(titles(store.getState() as Workspace)).toContain('Cap 4')
})

test('restoring the parked copy puts it back, saves it and clears the record', async () => {
  const store = await import('../src/app/store')
  const before = puts.length

  store.restoreKeptCopy()

  // Still on disk: only the save that carries it can clear the record.
  expect(keptStored()).toBeTruthy()
  expect(titles(store.getState() as Workspace)).toContain('Cap A')
  await waitFor(() => puts.length === before + 1)
  const sent = puts[before]
  // Saved on top of the copy that beat it, which is the point of restoring.
  expect(sent.baseUpdatedAt).toBe(1_500)
  expect(titles(sent.state)).toContain('Cap A')
  expect(titles(sent.state)).toContain('Cap B')
  await waitFor(() => keptStored() === undefined)
})

test('discarding the parked copy clears the record and saves nothing', async () => {
  const store = await import('../src/app/store')
  await parkACopy(store, 'Drop', 9_020)
  expect(keptStored()).toBeTruthy()
  const before = puts.length

  store.discardKeptCopy()

  expect(keptStored()).toBeUndefined()
  await new Promise((r) => setTimeout(r, 500))
  expect(puts.length).toBe(before)
})

test('a restore whose save fails keeps the parked copy for another try', async () => {
  const store = await import('../src/app/store')
  await parkACopy(store, 'Keep', 9_030)
  expect(keptStored()).toBeTruthy()

  // The tab drops offline while the restore save is in flight.
  replies.push(() => {
    throw new Error('offline')
  })
  const before = puts.length
  store.restoreKeptCopy()
  await waitFor(() => puts.length === before + 1)
  await new Promise((r) => setTimeout(r, 200))

  // Nothing acknowledged those edits, so the record is still there to restore again.
  expect(keptStored()).toBeTruthy()
  expect(titles(store.getState() as Workspace)).toContain('Keep A')

  store.restoreKeptCopy()
  await waitFor(() => keptStored() === undefined)
  // Only the save that carried them clears the record.
  expect(titles(puts[puts.length - 1].state)).toContain('Keep B')
})

test('a restore that hits a 409 is merged, and only its acknowledged save clears the record', async () => {
  const store = await import('../src/app/store')
  await parkACopy(store, 'Junction', 9_050)
  expect(keptStored()).toBeTruthy()

  // The account moves again between the restore and its save.
  const newest = store.getState() as Workspace
  replies.push(() => json({ conflict: true, ...elsewhere(newest, 'Raced', 1_600, 9_060) }, 409))
  // Hold the merged save, so the record can be checked while it is still unanswered.
  const releaseMerged = holdNextPut()
  const before = puts.length
  store.restoreKeptCopy()

  await waitFor(() => puts.length === before + 1)
  expect(puts[before].baseUpdatedAt).toBe(1_500)
  expect(titles(puts[before].state)).toContain('Junction A')

  // Rejected, so the restored copy is merged onto the newer base rather than parked
  // again, and goes back out under the newer updatedAt.
  await waitFor(() => puts.length === before + 2)
  expect(puts[before + 1].baseUpdatedAt).toBe(1_600)
  expect(titles(puts[before + 1].state)).toContain('Junction A')
  expect(titles(puts[before + 1].state)).toContain('Junction B')
  expect(titles(puts[before + 1].state)).toContain('Raced')
  // Nothing has acknowledged the restore yet: the record is still there to try again.
  expect(keptStored()).toBeTruthy()

  // The merge was acknowledged with the restored edits in it, so the record can go.
  releaseMerged(json({ ok: true, updatedAt: 9_700 }))
  await waitFor(() => keptStored() === undefined)
  expect(titles(store.getState() as Workspace)).toContain('Junction A')
  expect(titles(store.getState() as Workspace)).toContain('Raced')
})

test('a parked copy belongs to the account that parked it', async () => {
  const store = await import('../src/app/store')
  // This account's merge hits the cap, so its copy is parked here.
  await parkACopy(store, 'Scope', 9_070)
  expect(keptStored()).toBeTruthy()
  const before = puts.length

  // Someone else signs in on the same browser. Their page load must not bring the
  // other account's parked edits onto their screen, or into their save.
  meSub = 'u2'
  const other = await freshStore('scope-u2')
  await other.bootstrapAuth()
  expect(titles(other.getState() as Workspace)).not.toContain('Scope A')

  other.restoreKeptCopy()
  other.discardKeptCopy()
  await new Promise((r) => setTimeout(r, 400))
  // Nothing to offer, so nothing saved and nothing cleared.
  expect(puts.length).toBe(before)
  expect(keptStored()).toBeTruthy()

  // Back on the account that parked them: the same stored record is offered, and
  // restoring it still clears it once its save lands.
  meSub = 'u1'
  const mine = await freshStore('scope-u1')
  await mine.bootstrapAuth()
  mine.restoreKeptCopy()
  await waitFor(() => titles(mine.getState() as Workspace).includes('Scope A'))
  await waitFor(() => keptStored() === undefined)
})

test('a copy parked by the pre-scoping build is dropped, not given to an account', async () => {
  const store = await import('../src/app/store')
  // The old build's record: the bare key, with no account on it.
  const stale = store.getState() as Workspace
  const orphan = { savedAt: 1, state: { ...stale, issues: [{ ...stale.issues[0], number: 7_777, title: 'Orphan' }, ...stale.issues] } }
  memory.set('m3tal-review:kept', JSON.stringify(orphan))
  // An account's own parked copy, filed properly, is not the orphan's business.
  const owned = JSON.stringify({ savedAt: 2, state: stale })
  memory.set(keptKey(), owned)
  const before = puts.length

  // The next page load drops the ownerless record instead of offering it here.
  const next = await freshStore('legacy-boot')
  await next.bootstrapAuth()
  expect(memory.get('m3tal-review:kept')).toBeUndefined()
  expect(keptStored()).toBe(owned)
  expect(titles(next.getState() as Workspace)).not.toContain('Orphan')
  await new Promise((r) => setTimeout(r, 400))
  // Nothing was restored or saved on its behalf.
  expect(puts.length).toBe(before)
})

test('a 401 on the restore save leaves the record in storage', async () => {
  const store = await import('../src/app/store')
  await parkACopy(store, 'Expire', 9_040)
  expect(keptStored()).toBeTruthy()

  // The session ends under the restore save.
  replies.push(() => json({ error: 'unauthorized' }, 401))
  const before = puts.length
  store.restoreKeptCopy()
  await waitFor(() => puts.length === before + 1)
  // Signing out stops the writer, so there is no retry to clear it either.
  await new Promise((r) => setTimeout(r, 500))
  expect(puts.length).toBe(before + 1)

  const kept = JSON.parse(keptStored() ?? 'null') as { state: Workspace } | null
  expect(kept).not.toBeNull()
  expect(titles(kept!.state)).toContain('Expire A')
  // The browser's own workspace and the resume record carry the same copy, which
  // is what the next sign-in replays.
  expect(titles(JSON.parse(memory.get('m3tal-review:v1') ?? 'null') as Workspace)).toContain('Expire B')
  expect(memory.get('m3tal-review:resume')).toBeTruthy()
})
