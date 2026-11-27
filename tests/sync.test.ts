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

;(globalThis as any).fetch = async (input: unknown, init?: { method?: string; body?: unknown }) => {
  const url = String(input)
  const method = init?.method ?? 'GET'
  if (url.endsWith('/api/me')) return json({ available: true, user: { sub: 'u1', name: 'Tess', email: null } })
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

test('a merge that hits the cap parks the copy instead of losing it', async () => {
  const store = await import('../src/app/store')
  const base = store.getState() as Workspace
  const start = puts.length

  const releaseFirst = holdNextPut()
  for (const [title, at, number] of [
    ['Theirs one', 1_300, 9_011],
    ['Theirs two', 1_400, 9_012],
    ['Theirs three', 1_500, 9_013],
  ] as const) {
    replies.push(() => json({ conflict: true, ...elsewhere(base, title, at, number) }, 409))
  }

  store.createIssue(draft('Mine E'))
  await waitFor(() => puts.length === start + 1)
  store.createIssue(draft('Mine F'))
  releaseFirst(json({ conflict: true, ...elsewhere(base, 'Theirs first', 1_250, 9_010) }, 409))

  // Three merges run, then the cap: nothing further is sent, so a contended
  // workspace cannot keep the tab saving forever.
  await waitFor(() => puts.length === start + 4)
  const settled = puts.length
  await new Promise((r) => setTimeout(r, 600))
  expect(puts.length).toBe(settled)

  // The copy that lost is parked in this browser, edits and all.
  const kept = JSON.parse(memory.get('m3tal-review:kept') ?? 'null') as { state: Workspace } | null
  expect(kept).not.toBeNull()
  expect(titles(kept!.state)).toContain('Mine E')
  expect(titles(kept!.state)).toContain('Mine F')
  // The account's newest copy is what the tab shows instead.
  expect(titles(store.getState() as Workspace)).toContain('Theirs three')
})
