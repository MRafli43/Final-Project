# 0013: Consolidate Agent setup and add a stream entry point

Status: superseeded

Replaced by [0014](0014-simplify-source-only-agent-package.md). Streaming remains;
workflow compatibility and the separate six-tool budget are removed.

## Context

Agent setup is to move into index.ts alongside the model factory. Consumers need
a streaming API while the fixed workflow retains its current execution adapter.

## Decision

- Move Anvia Agent construction and createAgentExecution to index.ts; remove agent.ts.
- Keep execution interfaces and extraction schema in execution.ts, with no runtime
  dependency on the entry point. Inject execution into workflow.ts and provide
  the existing default through an index.ts wrapper to avoid circular imports.
- Add RunAgentOptions/runAgent returning AgentStream. Accept either prompt input
  with optional injected SDK memory/session, or a full messages history without
  memory/session, matching the installed SDK input semantics.
- Require trusted RunContext and injected repositories/callbacks. Register all
  three scoped tools and preserve confirmation callbacks. Capture the user ID.
- Reject mismatched session users and bind session userId to trusted context.
  Callers must authorize session IDs and configure memory stores to isolate users.
- Support a model instance override or modelConfig override; reuse the lazy factory
  otherwise. Reuse the product prompt, six-tool budget, four-turn limit, 4000-token
  limit, disabled retries, sequential tools, and 60-second cancellation deadline.
- Retain createAgentExecution and the public createWorkflow convenience API.

## Consequences

- runAgent is a low-level unverified text stream, not an application-kit API.
  Consumers must use createWorkflow for mandatory posting, duplicate, grounding,
  and verifier gates. Do not label streamed text verified or ready-to-send.
- Injected memory can persist conversation data under caller-controlled SDK
  policies; no built-in storage adapter, database, or automatic memory is added.
- Stream cancellation follows SDK semantics. The execution compatibility API
  remains available temporarily, without circular imports.

## Notes

Extends [0012](0012-consolidate-model-setup-and-defaults.md). Its historical note
about the entry-point/agent circular reference no longer applies. Existing model
defaults and verified workflow behavior are unchanged.
