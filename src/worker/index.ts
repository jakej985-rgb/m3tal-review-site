import { createFreebuffAuth, type FreebuffAuth, isSameOriginRequest } from '@freebuff/auth'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'

import { isWorkspace } from '../shared/workspace'

// The Worker in front of the app. Signed-in visitors get their workspace stored
// per account in D1; signed-out visitors use the browser-only demo in the client.
type Env = {
  ASSETS: Fetcher
  DB?: D1Database
  FREEBUFF_CLIENT_ID?: string
  FREEBUFF_ISSUER?: string
  APP_ORIGIN?: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('/api/subscribe', bodyLimit({ maxSize: 16 * 1024, onError: (c) => c.json({ error: 'Request is too large.' }, 413) }))
app.use('/api/state', bodyLimit({ maxSize: 1024 * 1024, onError: (c) => c.json({ error: 'Workspace payload is too large.' }, 413) }))

/* ------------------------------------------------------------------ */
/* Sign in with Freebuff                                               */
/* ------------------------------------------------------------------ */

// One instance per isolate per configuration: it caches discovery and keys.
const auths = new Map<string, FreebuffAuth>()

function authFor(env: Env): FreebuffAuth | null {
  // Without provisioning there is no client ID, so there is no sign-in to offer.
  if (!env.FREEBUFF_CLIENT_ID || !env.APP_ORIGIN) return null
  const key = `${env.APP_ORIGIN}|${env.FREEBUFF_CLIENT_ID}|${env.FREEBUFF_ISSUER ?? ''}`
  let auth = auths.get(key)
  if (!auth) {
    auth = createFreebuffAuth({ clientId: env.FREEBUFF_CLIENT_ID, issuer: env.FREEBUFF_ISSUER, baseUrl: env.APP_ORIGIN })
    auths.set(key, auth)
  }
  return auth
}

async function currentUser(c: { env: Env; req: { raw: Request } }) {
  const auth = authFor(c.env)
  return auth ? auth.getUser(c.req.raw) : null
}

/* ------------------------------------------------------------------ */
/* D1: one workspace per account                                       */
/* ------------------------------------------------------------------ */

const SCHEMA = 'CREATE TABLE IF NOT EXISTS workspaces (user_id TEXT PRIMARY KEY, state TEXT NOT NULL, updated_at INTEGER NOT NULL)'
const schemas = new WeakMap<D1Database, Promise<unknown>>()

function ensureSchema(db: D1Database) {
  let ready = schemas.get(db)
  if (!ready) {
    ready = db.prepare(SCHEMA).run().catch((error: unknown) => {
      // Never cache a failure: one transient D1 error would otherwise fail every
      // later request in this isolate.
      schemas.delete(db)
      throw error
    })
    schemas.set(db, ready)
  }
  return ready
}

/* ------------------------------------------------------------------ */
/* Routes                                                             */
/* ------------------------------------------------------------------ */

app.get('/api/health', (c) => c.json({ ok: true }))

app.get('/api/me', async (c) => {
  const auth = authFor(c.env)
  const user = auth ? await auth.getUser(c.req.raw) : null
  c.header('Cache-Control', 'private, no-store')
  // `available: false` means this deployment has no client ID (local dev), so the
  // UI hides the sign-in controls instead of linking to a route that cannot work.
  return c.json({
    available: !!auth,
    user: user ? { sub: user.sub, name: user.name ?? null, email: user.email ?? null } : null,
  })
})

// The signed-in visitor's saved workspace.
app.get('/api/state', async (c) => {
  const user = await currentUser(c)
  if (!user) return c.json({ error: 'Sign in required' }, 401)
  const store = c.env.DB ?? null
  if (!store) return c.json({ error: 'Storage is not configured.' }, 503)
  c.header('Cache-Control', 'private, no-store')
  await ensureSchema(store)
  const row = await store
    .prepare('SELECT state, updated_at FROM workspaces WHERE user_id = ?')
    .bind(user.sub)
    .first<{ state: string; updated_at: number }>()
  if (!row) return c.json({ state: null, updatedAt: null })
  return c.json({ state: JSON.parse(row.state) as unknown, updatedAt: row.updated_at })
})

// Saves are optimistic: the client sends the `updatedAt` it last saw, and a row
// that has moved on since then is never overwritten. The newer copy goes back in
// the 409 so the losing tab can adopt it instead of clobbering it.
async function conflict(store: D1Database, userId: string) {
  const row = await store.prepare('SELECT state, updated_at FROM workspaces WHERE user_id = ?').bind(userId).first<{ state: string; updated_at: number }>()
  return {
    error: 'This workspace changed in another tab or on another device.',
    conflict: true,
    state: row ? (JSON.parse(row.state) as unknown) : null,
    updatedAt: row?.updated_at ?? null,
  }
}

app.put('/api/state', async (c) => {
  if (!isSameOriginRequest(c.req.raw, c.env.APP_ORIGIN ?? '')) return c.json({ error: 'Cross-origin request refused.' }, 403)
  const user = await currentUser(c)
  if (!user) return c.json({ error: 'Sign in required' }, 401)
  const store = c.env.DB ?? null
  if (!store) return c.json({ error: 'Storage is not configured.' }, 503)
  const body = (await c.req.json().catch(() => null)) as { state?: unknown; baseUpdatedAt?: unknown } | null
  const payload = body?.state
  if (!isWorkspace(payload)) return c.json({ error: 'Invalid workspace payload.' }, 400)
  const base = typeof body?.baseUpdatedAt === 'number' ? body.baseUpdatedAt : null
  const json = JSON.stringify(payload)
  await ensureSchema(store)
  c.header('Cache-Control', 'private, no-store')

  const current = await store.prepare('SELECT updated_at FROM workspaces WHERE user_id = ?').bind(user.sub).first<{ updated_at: number }>()

  if (base === null) {
    // Nothing loaded on the client: only create the row if no one else has.
    if (current) return c.json(await conflict(store, user.sub), 409)
    const now = Date.now()
    const inserted = await store
      .prepare('INSERT INTO workspaces (user_id, state, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO NOTHING')
      .bind(user.sub, json, now)
      .run()
    if (!inserted.meta.changes) return c.json(await conflict(store, user.sub), 409)
    return c.json({ ok: true, updatedAt: now })
  }

  if (!current || current.updated_at !== base) return c.json(await conflict(store, user.sub), 409)
  // Strictly increasing, so two saves inside the same millisecond still order.
  const next = Math.max(Date.now(), base + 1)
  const updated = await store
    .prepare('UPDATE workspaces SET state = ?, updated_at = ? WHERE user_id = ? AND updated_at = ?')
    .bind(json, next, user.sub, base)
    .run()
  if (!updated.meta.changes) return c.json(await conflict(store, user.sub), 409)
  return c.json({ ok: true, updatedAt: next })
})

// Changelog subscription from the landing page. There is no mailing list behind
// it yet, so a valid address is rejected as not implemented rather than
// acknowledged: nothing is stored and no email is sent. Wire this to an email
// provider or a D1 table and drop the `demo` flag with it.
app.post('/api/subscribe', async (c) => {
  const body = await c.req.json<{ email?: unknown }>().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return c.json({ error: 'Enter a valid email address.' }, 400)
  }
  return c.json({ error: 'This demo does not collect addresses.', demo: true }, 501)
})

app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404))

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

// Exported so the Worker's own tests can drive routes without a live session.
export { app }

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const auth = authFor(env)
    // The wrap serves /auth/freebuff/{signin,callback,signout,session} and keeps
    // sessions fresh, so it has to see every request before the SPA fallback.
    if (!auth) return app.fetch(request, env, ctx)
    return auth.wrap((req: Request) => app.fetch(req, env, ctx))(request)
  },
}
