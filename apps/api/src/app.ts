import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { logger as requestLogger } from 'hono/logger'
import { z } from 'zod'

export const app = new Hono()

app.use(
  '*',
  requestLogger((message) => console.info(message)),
)

app.get('/api/health', (c) => c.json({ status: 'ok' }))

app.get(
  '/api/hello',
  zValidator('query', z.object({ name: z.string().trim().min(1).max(100).default('world') })),
  (c) => {
    const { name } = c.req.valid('query')
    return c.json({ message: `Hello, ${name}!` })
  },
)

app.onError((error, c) => {
  console.error('Unhandled request error', error)
  return c.json({ error: 'Internal server error' }, 500)
})
