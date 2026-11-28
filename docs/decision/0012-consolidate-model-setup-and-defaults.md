# 0012: Consolidate model setup and configure defaults

Status: superseeded

Replaced by [0014](0014-simplify-source-only-agent-package.md). Model defaults and
lazy setup remain; compatibility helpers are removed.

## Context

Model setup should live in the agents package entry point and use the requested
Devscale gateway and model defaults instead of requiring all three variables.
This replaces [0008](0008-establish-anvia-agent-foundation.md)'s configuration
policy while retaining its SDK versions, contracts, and build/export conventions.

## Decision

- Move configuration validation and model construction to `src/index.ts`; remove
  `config.ts` and `models.ts` and update agent references.
- Require server-only MODEL_API_KEY, without any credential default.
- Default absent MODEL_BASE_URL to https://gateway.devscale.id/v1 and absent
  MODEL_ID to deepseek-v4.1-flash. Explicit empty values remain invalid.
- Use OpenAIClient with validated apiKey/baseUrl, then completionModel with
  the configured modelId and api: chat. Keep initialization lazy.
- Retain the public loadModelConfig/createCompletionModel API, explicit config
  injection, redacted validation errors, URL restrictions, and browser guard.
- Keep environment files explicit and secrets out of VITE_* variables. Document
  non-secret defaults in the example environment and package README.

## Consequences

- Only a key is needed when using the default gateway/model; deployments can
  override both non-secret settings.
- The entry-point and agent modules reference each other; functions defer model
  configuration access until execution, avoiding import-time initialization.
- Import/default checks do not verify provider availability or model quality;
  no paid request is required for tests.

## Notes

The model/agent implementation separation now means setup in index.ts and agent
execution in agent.ts, rather than a standalone models.ts. Other workflow and
verifier decisions remain unchanged.
