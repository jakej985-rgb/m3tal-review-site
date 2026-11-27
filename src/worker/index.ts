import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'

// The Worker in front of the app. The tracker itself keeps its data in the
// browser (localStorage); add API routes here when you move it to D1.
type Env = {
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Env }>()

app.use('/api/*', bodyLimit({ maxSize: 16 * 1024, onError: (c) => c.json({ error: 'Request is too large.' }, 413) }))

app.get('/api/health', (c) => c.json({ ok: true }))

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

export default app
