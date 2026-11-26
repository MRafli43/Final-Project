# Kerja Woy

See [Documentation](docs/README.md) for technical decisions and product notes.

Basic TypeScript monorepo managed with pnpm. Requires Node.js 22.12+ and pnpm 11.

```text
apps/
  api/          Hono + Zod + @hono/zod-validator (Node.js)
  platform/     React + Vite + TanStack Router (file-based routing)
packages/
  agents/       Source-only Anvia agent and scoped read-only tools
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

| Command                                     | Description                                    |
| ------------------------------------------- | ---------------------------------------------- |
| `pnpm dev`                                  | Start both applications                        |
| `pnpm dev:api`                              | Start only the API                             |
| `pnpm dev:platform`                         | Start only the platform                        |
| `pnpm build`                                | Build all packages in dependency order         |
| `pnpm typecheck`                            | Generate routes and type-check all packages    |
| `pnpm lint`                                 | Lint the workspace with Oxlint (warnings fail) |
| `pnpm lint:fix`                             | Apply available lint fixes                     |
| `pnpm format`                               | Format the workspace with Oxfmt                |
| `pnpm format:check`                         | Check formatting without changing files        |
| `pnpm --filter @kerja-woy/api start`        | Run the built API                              |
| `pnpm --filter @kerja-woy/platform preview` | Preview the built platform                     |

## File-based routing

Add route files to `apps/platform/src/routes/`. The TanStack Router Vite plugin
generates `apps/platform/src/routeTree.gen.ts` during development and builds.
Do not edit that generated file manually; commit it alongside your routes.

## End-to-end tests

Playwright is configured at the workspace root in `playwright.config.ts`, with
tests in `e2e/`. Install Chromium once, then run the tests:

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

On Linux CI, use `pnpm exec playwright install --with-deps chromium` to install
the required system libraries as well.

Tests automatically start the API on port 3000 and the platform on port 5173.
Locally, existing servers on those ports are reused; CI always starts fresh
servers. Tests cover the API health endpoint, greeting validation, the home page,
and file-based navigation. API checks go through Vite's `/api` proxy.

- `pnpm test:e2e:ui` — open Playwright's interactive test UI.
- `pnpm test:e2e:headed` — run with a visible browser.
- `pnpm test:e2e:report` — open the HTML report from the last run.

Failed tests retain traces and screenshots. Reports and test artifacts are ignored
by Git, linting, and formatting. Root `pnpm typecheck` also checks the Playwright
configuration and tests. E2E execution is separate from the pre-commit hook.

## Git hooks and code quality

`pnpm install` sets up Husky through the root `prepare` script. Before each commit,
the hook runs `pnpm lint`, `pnpm typecheck`, and `pnpm build` in that order. A failed
command stops the hook and blocks the commit.

Formatting is explicit: run `pnpm format` before staging changes, or use
`pnpm format:check` to check formatting without modifying files. Generated route
trees, build output, and dependencies are excluded from linting and formatting;
the generated pnpm lockfile is also excluded from formatting.

## API and deployment

The API defaults to port `3000`; set the `PORT` environment variable to override it.
Vite proxies `/api` requests to `http://localhost:3000` during development.
If you change the API port, update the proxy in `apps/platform/vite.config.ts`.
In production, serve the platform's `dist/` with SPA fallback to `index.html`, and
reverse-proxy `/api` to the Node API on the same origin. Vite's preview command is
only a static preview and does not configure the production API proxy.

`GET /api/hello` validates the optional `name` query parameter with Zod and
`zValidator`; invalid input returns HTTP 400.

## Agent and server environment

Copy `.env.example` to the root `.env` only if `.env` does not already exist.
Preserve existing credentials. Root `.env` is ignored by Git; secret examples are
blank placeholders. API dev/start load it using `--env-file-if-exists`; existing
process variables take precedence. The platform does not load this root file.
Never put credentials in `VITE_*` variables or import agents into frontend code.

`MODEL_API_KEY` is required when creating the model. `MODEL_BASE_URL` defaults to
`https://gateway.devscale.id/v1`; `MODEL_ID` defaults to `deepseek-v4.1-flash`.
Explicit empty overrides are invalid. Initialization is lazy and uses Chat
Completions. Lint, typecheck, and build make no model calls.

```text
packages/agents/
  package.json
  tsconfig.json
  src/
    index.ts
    prompts/instruction.ts
    tools/get-profile.ts
    tools/search-facts.ts
    tools/check-duplicate.ts
    tools/web-search.ts
```

The package exports TypeScript source. Server consumers need a TypeScript-aware
runtime/bundler such as tsx; do not expect agents/dist. Build only typechecks and
emits no files. No current application imports agents or exposes a model endpoint.

`runAgent(options)` returns Anvia `AgentStream`. Supply authenticated
`context: { userId, requestId }`, injected `dependencies: { profiles, facts,
applications }`, and either `prompt` or `messages`. Each tool owns its adapter
interface and factory. Missing adapters fail clearly; there is no fake/default
retrieval. Underlying queries must be user-scoped; cross-user results are rejected.
Optional `onFacts` receives retrieved confirmed facts. Model instance/configuration
overrides and `abortSignal` are supported.

Prompt input supports optional injected SDK memory and an authorized session.
Callers must authorize session IDs and isolate memory stores; session user is
bound to trusted context. Messages input cannot also use memory/session. No
persistence adapter is included. Runs retain a 60-second deadline, four SDK turns,
sequential tools, disabled retries, and a 4000-token call limit. The separate
six-execution tool budget was removed with the workflow.

Streams are **unverified and never ready-to-send**. The fixed workflow, independent
draft verifier, agent tests, smoke runner, and PRD 40-case eval suite are deferred,
not replaced by prompt instructions. Persistence, PDF, Telegram, MCP, production
RAG, and Anvia Lens remain outstanding. Existing application E2E tests remain.
API logging now uses basic console calls rather than a shared logger package.

Optional public web searches use Tavily and require server-only `TAVILY_API_KEY`,
read lazily at tool invocation. Queries are limited to 500 characters and five
results with a 15-second request timeout. Do not send CV text, candidate personal
data, private facts, or credentials. This restriction is prompt/tool guidance, not
a privacy-filter guarantee. Results are untrusted and must cite source URLs;
snippets do not verify contact emails or job legitimacy. No live search is needed
for typecheck or build.
