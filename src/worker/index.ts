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

// Changelog subscription from the landing page. Wire this to your email
// provider or a D1 table; it currently validates and acknowledges.
app.post('/api/subscribe', async (c) => {
  const body = await c.req.json<{ email?: unknown }>().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return c.json({ error: 'Enter a valid email address.' }, 400)
  }
  return c.json({ ok: true, demo: true })
})

app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404))

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
