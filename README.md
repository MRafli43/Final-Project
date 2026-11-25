# Kerja Woy

See [Documentation](docs/README.md) for technical decisions and product notes.

Basic TypeScript monorepo managed with pnpm. Requires Node.js 22.12+ and pnpm 11.

```text
apps/
  api/          Hono + Zod + @hono/zod-validator (Node.js)
  platform/     React + Vite + TanStack Router (file-based routing)
packages/
  logger/       Shared console logger
```

## Getting started

```sh
pnpm install
pnpm dev
```

- Platform: http://localhost:5173
- API health: http://localhost:3000/api/health
- Validated example: http://localhost:3000/api/hello?name=World

On Windows, use `pnpm.cmd` instead of `pnpm` if PowerShell blocks scripts.

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start both applications |
| `pnpm dev:api` | Start only the API |
| `pnpm dev:platform` | Start only the platform |
| `pnpm build` | Build all packages in dependency order |
| `pnpm typecheck` | Generate routes and type-check all packages |
| `pnpm --filter @kerja-woy/api start` | Run the built API |
| `pnpm --filter @kerja-woy/platform preview` | Preview the built platform |

## File-based routing

Add route files to `apps/platform/src/routes/`. The TanStack Router Vite plugin
generates `apps/platform/src/routeTree.gen.ts` during development and builds.
Do not edit that generated file manually; commit it alongside your routes.

## API and deployment

The API defaults to port `3000`; set the `PORT` environment variable to override it.
Vite proxies `/api` requests to `http://localhost:3000` during development.
If you change the API port, update the proxy in `apps/platform/vite.config.ts`.
In production, serve the platform's `dist/` with SPA fallback to `index.html`, and
reverse-proxy `/api` to the Node API on the same origin. Vite's preview command is
only a static preview and does not configure the production API proxy.

`GET /api/hello` validates the optional `name` query parameter with Zod and
`zValidator`; invalid input returns HTTP 400.

## Shared logger

```ts
import { createLogger } from '@kerja-woy/logger'

const logger = createLogger('my-service')
logger.info('Started')
logger.error('Request failed', new Error('Example'))

```

The logger exports built JavaScript and TypeScript declarations. API development
builds it automatically; after editing the logger, run
`pnpm --filter @kerja-woy/logger build` again.
