# 0017: Remove agent tools and the product prompt

Status: superseeded

Replaced by [0018](0018-add-job-recommendation-pipeline.md) for registration of the
job recommendation tool. No product prompt directory is restored.

## Context

The requested agent baseline now consists of index.ts and an empty tools folder.

## Decision

- Delete all tool implementations and the prompts directory; remove their imports,
  registrations, and tool-specific dependencies/onFacts options from runAgent.
- Keep Anvia Agent setup, model configuration, lazy initialization, streaming,
  prompt/messages input, memory/session checks, model overrides, and cancellation.
- Do not add a replacement product prompt or tool. Leave installed dependencies
  and environment configuration unchanged in this cleanup.
- Keep tools empty locally without a placeholder file; Git does not track empty
  directories.

## Consequences

- The agent cannot retrieve profile/fact/application data or search the web.
  There are no built-in product-specific instructions or verification guarantees.
- Callers no longer supply tool adapters or confirmed-fact callbacks to runAgent.
- Replaces 0014's tool/prompt structure and 0016's web-search implementation;
  other model, workspace, and infrastructure decisions remain unchanged.

## Notes

Replaces the relevant parts of [0014](0014-simplify-source-only-agent-package.md)
and [0016](0016-add-public-web-search-tool.md); historical records are preserved.
