# 0010: Add a single agent with a fixed workflow

Status: superseeded

## Context

The existing Anvia foundation and scoped read-only tools need an orchestrated
analyze/prepare_draft flow. Mandatory safety steps must not depend on model choices.

## Decision

- Separate product instructions, Agent construction, model factory, and workflow.
  Use one Anvia Agent for either mode; parse postings with a separate structured
  completion on the same lazily initialized model, not another autonomous agent.
- Validate bounded input, extract verbatim requirements, assign stable SHA-256
  IDs from posting ID and requirement text, check duplicates, retrieve confirmed
  facts, execute the agent, and validate output in that fixed order.
- Duplicate checks use exact posting IDs. Duplicates stop preparation before
  retrieval or drafting; analysis may continue with duplicate context.
- Use SDK outputSchema for extraction and agent output, then independently parse
  and check IDs/grounding in the workflow. Reject invented requirement text,
  unknown references, conflicting fact IDs, and incomplete analysis coverage.
- Restrict initial CV bullets to exact retrieved fact text and outreach to a safe
  fixed template. This deliberately favors verifiable grounding over paraphrasing.
  Empty drafts need a gap or clarification. Missing evidence must not be invented.
- Permit one agent output repair attempt; share the evidence and execution budget
  across both attempts. Invalid extraction fails immediately without repair.
- Count at most six tool executions in code, including mandatory duplicate/fact
  reads. Increment before execution; reject a seventh invocation even if the SDK
  converts tool failures to model-visible data. Fail the workflow if a tool fails.
- Set maxTurns to four, toolConcurrency to one, maxTokens to 4000 per model call,
  disable SDK retries, and apply a shared 60-second abort deadline plus caller
  cancellation across extraction, reads, generation, and repair.
- Do not configure logging, traces, observers, memory, sending, persistence, PDF,
  Telegram, URL fetching, or job scheduling. Prompts and outputs are not logged.
- Extend the Node unit tests with injected execution mocks and a mocked completion
  model exercising the actual Agent and structured completion paths.

## Consequences

- SDK maxTurns counts tool-loop turns, not individual tool calls; the separate
  budget is necessary and applies across repairs. Provider calls remain bounded
  by turns, tokens, retry settings, and the shared deadline.
- SDK/provider structured-output capability is required; unsupported providers
  fail rather than silently accepting unchecked text.
- Cancellation stops workflow waiting and is passed to SDK calls and tools.
  Current repository interfaces have no cancellation parameter; an already-running
  repository operation may finish after cancellation. No subsequent step proceeds.
- Typed failures omit raw errors, prompts, and model output. A timeout is reported
  as cancelled. The repair does not replay invalid output into the prompt.
- Exact references prove provenance, not semantic entailment of analysis prose.
  Analysis explanations/recommendations and extracted importance remain model
  judgments; prompt rules and reference validation do not prove their truth.
- Deterministic mocks test control flow and validation, not real model quality,
  prompt-injection resistance, or production retrieval performance.

## Notes

Replaced by [0011: Add mandatory draft verification and opt-in smoke execution](0011-add-mandatory-draft-verification.md).

Extends [0008](0008-establish-anvia-agent-foundation.md) and
[0009](0009-add-scoped-read-only-tools.md); neither is replaced.
Inspected installed Agent, AgentRunSettings, Tool, structured completion types,
and SDK implementation. Reference agent/model separation:
https://github.com/Devscale-Indonesia/anvia-fullstack-app/tree/main/packages/agents
