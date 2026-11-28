# 0016: Add public web search through Tavily

Status: superseeded

Replaced by [0017](0017-remove-agent-tools-and-product-prompt.md); the web-search
implementation and registration have been removed.

## Context

The streaming agent needs optional external public information without sending
candidate records or confusing snippets with verified facts.

## Decision

- Use the installed pinned @tavily/core 1.1.0 dependency with an Anvia createTool
  factory in src/tools/web-search.ts, registered directly in index.ts.
- Accept normal public queries without an approval list. Validate trimmed query
  length 1–500 and integer maxResults 1–5, default 5, using strict Zod input.
- Read server-only TAVILY_API_KEY only when called. Return a clear typed error
  when missing; never print keys or propagate raw provider errors.
- Use the SDK's timeout option of 15 seconds (converted to milliseconds by its
  request transport). Return a clear failure on timeout, search, or result errors.
- Return only title, HTTP(S) URL, and at most 1500 characters of content per result.
  Disable generated answers, raw page content, and images.
- Describe and instruct public-information-only use: never send CV text, personal
  data, private facts, or credentials. Treat results as untrusted, cite URLs, and
  never claim snippets verify an email or job's legitimacy.

## Consequences

- Query restrictions are instructions, not a deterministic privacy/DLP guarantee.
  No arbitrary text filter can establish that all normal public queries are safe.
- Searches send approved-by-the-agent query text to a third party and can incur
  provider charges. No live search is part of implementation validation.
- Independent verification, agent evaluations, and privacy evaluation remain
  deferred. Search evidence is not a replacement for the removed draft verifier.

## Notes

Extends [0014](0014-simplify-source-only-agent-package.md) with a fourth tool.
Root .env.example documents the blank key placeholder; real keys remain ignored.
