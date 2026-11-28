# 0018: Add an evidence-based job recommendation pipeline

Status: accepted

## Context

The bare streaming agent needs job recommendations from injected data, without
introducing a database or RAG implementation.

## Decision

- Register createRecommendJobsTool with trusted userId, a required server-bound
  JobDataAdapter, and the existing lazy model factory/override. No data adapter or
  user identity is accepted from model-generated tool arguments.
- Use the installed @anvia/core/pipeline API: constructor inputSchema, chained
  step({ id, run }), and run({ input, abortSignal }).
- Validate bounded input and structure evidence verbatim with stable per-input
  IDs. Empty target roles become undefined; adapters select from experience/skills.
- Retrieve at most 20 candidates. Reject empty requirement sets and duplicate
  requirement IDs; fail closed on malformed adapter responses or duplicate jobs.
- Compare requirements using structured completion on the existing model. Require
  complete requirement coverage and existing evidence references. No model scores.
- Compute required weight 2 / optional weight 1 and match 1 / partial 0.5 /
  missing evidence 0 in code; score is weighted points / total weights * 100.
  Sort descending, break ties by ID, and return at most five jobs with assessments,
  quoted evidence, explanations, learning suggestions, and rejected-job reasons.
- Provide an explicitly selected fictional adapter for local testing, never a
  fallback. All included jobs are marked fictional in metadata and titles.
- Apply cancellation and a 60-second deadline, disable model retries, and redact
  underlying failures rather than returning potentially sensitive adapter errors.

## Consequences

- Missing evidence is not a claim that the candidate lacks a skill.
- Reference validation does not establish semantic entailment. Model comparisons
  and learning suggestions remain unverified judgments, not hiring guarantees.
- Candidate profile facts are user supplied, not independently confirmed. The
  injected adapter is responsible for authorizing and scoping its data access.
- Model quality/adversarial evaluation, database/RAG, and draft verification remain
  deferred. Fictional retrieval is a local fixture, not production search quality.
- Repository adapters must cooperate with cancellation to stop ongoing work.

## Notes

Replaces [0017](0017-remove-agent-tools-and-product-prompt.md)'s empty-tools choice
only; model configuration and remaining simplified architecture are unchanged.
No live model calls are needed for typecheck.
