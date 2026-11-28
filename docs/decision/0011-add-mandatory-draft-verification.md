# 0011: Add mandatory draft verification and opt-in smoke execution

Status: superseeded

Replaced by [0014](0014-simplify-source-only-agent-package.md). Workflow,
verification, smoke execution, and agent tests are deferred.

## Context

The fixed workflow needs independent draft verification, auditable bullet outcomes,
and a local real-model smoke entry point. Exact text matching alone cannot establish
semantic truth or rule out seniority inflation.

## Decision

- Replace [0010](0010-add-single-agent-fixed-workflow.md) with the same mandatory
  workflow and limits plus a draft verifier before returning an application kit.
  Retain its analysis behavior, tool budget, deadline, and cancellation controls.
- Capture full confirmed facts from the scoped retrieval tool via a trusted callback;
  model-visible tool results cannot supply ownership or confirmation metadata.
- Reject unknown, ambiguous, unconfirmed, cross-user, and missing evidence IDs.
  Normalize NFKC/lowercase Unicode tokens, preserving numeric and identifier
  punctuation, then require generated tokens in cited evidence. No synonyms,
  stemming, numeric conversion, or title equivalence. Rules and limitations are
  detailed in the [package README](../../packages/agents/README.md).
- Always use a structured model review for identity-valid bullets, even if lexical
  checks fail. Review unsupported claims, attribution, and seniority inflation.
  Lexical overlap is never treated as semantic proof.
- Allow one feedback rewrite per eligible failed bullet, then repeat deterministic
  and model checks. Drop remaining failures with reasons; identity failures are
  not rewritten. Cap drafts at 20 bullets. Existing single structural output repair
  remains separate; verifier failure never triggers another agent output attempt.
- Fail the whole draft closed if verification cannot complete. Return reports of
  kept, rewritten, and dropped bullets; always label output human_review_required.
  Keep outreach restricted to the safe fixed template.
- Use real Anvia structured completion calls for review/rewrite, not a second
  autonomous agent, with no tools, SDK retries, or default payload logging.
- Add an opt-in local smoke runner with fictional data and explicit environment
  loading. Require KERJA_WOY_APPROVE_PAID_SMOKE=yes before calls; do not invoke
  paid smoke execution during this implementation task.

## Consequences

- Verification adds model calls and latency within the shared deadline. An outage
  prevents draft return, rather than treating unreviewed bullets as approved.
- Strict lexical rules can reject valid paraphrases. Model checks can still miss
  unsupported claims; human review remains necessary.
- Mock tests cover plumbing, not a completed adversarial/quality evaluation.
- Persistence, PDF, Telegram, MCP, production RAG, Anvia Lens, and the PRD's
  40-case eval suite remain outstanding, not implicitly implemented here.

## Notes

See the package README for PowerShell smoke instructions. No paid API call is
needed for deterministic tests. The prior record is preserved for history.
