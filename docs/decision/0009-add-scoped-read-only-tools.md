# 0009: Add scoped read-only tools and Node unit tests

Status: superseeded

Replaced by [0014](0014-simplify-source-only-agent-package.md). Tool isolation is
retained in self-contained modules; agent tests and fixtures are deferred.

## Context

The [Anvia foundation](0008-establish-anvia-agent-foundation.md) needs initial
read-only tools without introducing persistence or an agent loop. No existing
package unit test framework is configured; Playwright serves E2E tests only.

## Decision

- Use installed `@anvia/core/tool` createTool with Zod input/output schemas and
  handlers. SDK declarations expose call and parseInput; handlers additionally
  validate arguments so direct calls cannot bypass validation.
- Inject ProfileRepository, FactRetriever, and ApplicationRepository into a
  per-run createReadOnlyTools factory. Capture the trusted RunContext userId;
  never accept userId from tool arguments. Authentication remains the caller's duty.
- Require user-scoped underlying repository queries. Reject cross-user results
  before returning output, including results beyond the requested fact limit.
- Search queries are trimmed, non-empty, and at most 500 characters; counts
  default to 5 and must be integers from 1 to 20. Return only confirmed facts'
  IDs, source references, and text, bounded to the requested count.
- get_profile returns a summary or null. check_duplicate checks an exact posting
  ID for the bound user and returns a boolean and existing application IDs.
  Reject results for a different posting. Empty matches are not duplicates.
- Provide fixture adapters through the explicit ./fixtures subpath, not the root
  barrel. These are development/test-only snapshots with user-scoped keyword
  substring matching, NOT production RAG.
- Use Node's built-in test runner with JavaScript tests against compiled output.
  The package test script builds first. No new unit-test dependency or Playwright
  usage is needed.

## Consequences

- No writes, sending, URL fetching, shell execution, databases, vector stores,
  embeddings, or MCP are introduced.
- Production repository implementations remain responsible for scoped queries;
  output ownership checks provide defense in depth, not query-level isolation.
- Duplicate checking does not normalize URLs or infer equivalent postings.
- Unit tests run deterministically without credentials or network access.

## Notes

The existing model and contract foundation remains accepted. This extends it
without replacing its decision. Fixtures are not a production retrieval strategy.
