import { serve } from '@hono/node-server'
import { createLogger } from '@kerja-woy/logger'
import { app } from './app.js'

const logger = createLogger('api')
const port = Number(process.env.PORT ?? 3000)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535')
}

const server = serve({ fetch: app.fetch, port }, (info) => {
  logger.info(`Listening on http://localhost:${info.port}`)
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close((error) => {
      if (error) logger.error('Failed to close server', error)
      process.exit(error ? 1 : 0)
    })
  })
}
