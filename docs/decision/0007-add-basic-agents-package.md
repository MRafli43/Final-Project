# 0007: Add a basic agents package

Status: superseeded

## Context

The workspace needs a basic agents package without a specified AI provider or
agent framework.

## Decision

- Add `@kerja-woy/agents` under `packages/agents`, following the shared-package
  conventions in [0001: Use a pnpm workspace](0001-use-pnpm-workspace.md).
- Export generic `Agent` and `AgentOptions` types and a `createAgent` helper from
  `src/index.ts`.
- Give agents a non-empty, trimmed name and a typed input/output handler.
- Support synchronous and asynchronous handlers through an always-async `run`
  method. Handler failures reject the returned promise.
- Add no runtime dependencies or AI provider integration.
- Export compiled ESM JavaScript and TypeScript declarations, with package build
  and type-check scripts matching the existing shared-package pattern.

## Consequences

- Consumers can define lightweight agents without committing to an AI SDK.
- Consumers must supply actual agent behavior; model calls, tools, memory, and
  orchestration are not included.
- The package must be built before consumers use its compiled exports.

## Notes

Replaced by [0008: Establish the Anvia agent foundation](0008-establish-anvia-agent-foundation.md).
The generic helper below is historical and no longer part of the public API.

Example usage:

```ts
import { createAgent } from '@kerja-woy/agents'

const greetingAgent = createAgent({
  name: 'greeting',
  handler: (name: string) => `Hello, ${name}!`,
})

const message = await greetingAgent.run('World')
```
