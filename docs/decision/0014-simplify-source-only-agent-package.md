# 0014: Simplify to a source-only agent package

Status: superseeded

Replaced by [0017](0017-remove-agent-tools-and-product-prompt.md) for the agent
tool/prompt structure. Other workspace and model conventions remain in effect.

## Context

The requested baseline is a small streaming agent with three injected read-only
tools, not a verified application-kit implementation or a shared logger package.

## Decision

- Keep only package.json, tsconfig.json, src/index.ts, the product prompt, and
  three tool modules in packages/agents (excluding pnpm-managed dependencies).
- Retain runAgent/RunAgentOptions returning AgentStream, prompt or messages input,
  prompt memory/session, cancellation, model overrides, lazy OpenAIClient setup,
  Chat Completions, and the server-only guard. Require MODEL_API_KEY and retain
  MODEL_BASE_URL/MODEL_ID defaults from 0012.
- Each tool owns its adapter interface, schemas, and factory. Import factories
  directly in index.ts. Validate inputs, scope queries by trusted user ID, reject
  cross-user results, return confirmed facts only, and fail on missing adapters.
- Remove compatibility execution exports, workflow, verifier, fixtures, agent
  tests, smoke runner, and package README. These are deferred, not replaced by
  prompt instructions. Preserve historical decision records.
- Keep SDK turn/token/deadline controls but remove the separate six-tool budget.
  Streams must never be labeled verified or ready-to-send.
- Export TypeScript source; build/typecheck use noEmit. Consumers need a
  TypeScript-aware runtime/bundler. No current application imports the agent.
- Remove packages/logger, its dependency, and prebuild steps. Use console at
  existing API logging sites without changing routes.
- Consolidate environment files at root, preserving credentials in ignored .env
  without printing them. Examples use blank secrets and non-secret defaults.
  Only API dev/start load root .env via --env-file-if-exists. Platform commands
  do not load it. Never put credentials in VITE_* variables.

## Consequences

- Workflow guarantees and independent claim verification are absent. Agent tests,
  adversarial/quality evaluation, and the PRD 40-case suite remain deferred.
- Persistence, PDF, Telegram, MCP, production RAG, and Anvia Lens are outstanding.
- Builds do not make model API calls.
- Replaces 0001's logger choice and 0009/0011/0012/0013's agent setup choices;
  other workspace, SDK dependency, application, and E2E conventions remain.

## Notes

See the root README for the resulting tree, environment setup, and adapter contract.
