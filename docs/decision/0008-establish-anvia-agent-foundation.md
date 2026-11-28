# 0008: Establish the Anvia agent foundation

Status: superseeded

## Context

Kerja Woy needs model configuration and shared contracts before implementing an
agent. This replaces [0007](0007-add-basic-agents-package.md), which introduced a
generic handler helper without an AI SDK.

## Decision

- Use published `@anvia/core` 1.23.0, `@anvia/openai` 1.4.1, and Zod 4.6.7.
  The OpenAI adapter accepts core ^1.22.0; core accepts Zod ^4.6.7.
- Use the reference project's OpenAI-compatible client pattern, verified against
  installed SDK declarations: `new OpenAIClient({ apiKey, baseUrl })` followed by
  `completionModel({ modelId, api: 'chat' })`. Do not copy other integrations.
- Export an explicit `createCompletionModel` factory. Validate configuration and
  construct clients only when called; importing the package needs no credentials.
- Require server-only MODEL_API_KEY, MODEL_BASE_URL, and MODEL_ID. No model or
  credential defaults, no VITE_* keys, and no automatic dotenv loading. Permit
  HTTP(S) API base URLs without embedded credentials, query strings, or fragments.
  Configuration errors omit supplied values. The package example leaves values blank.
- Export only the model factory/type, configuration loader/type, and contract
  schemas/inferred types from the root barrel. Keep compiled ESM and declaration
  exports and existing build/type-check conventions.
- Use strict Zod objects with non-empty identifiers/text. Confirmed facts require
  literal true and a sourceReference string (an opaque reference, not necessarily
  a URL). Posting sourceUrl is optional and HTTP(S); importance is required or
  preferred. Recommendations are apply, consider, or skip. Matches associate a
  requirement ID with supporting fact IDs; fit gaps identify requirements.
  Draft bullets require supporting IDs; application-kit gaps are explanatory text.
- Brand parsed RunContext and require it to originate in trusted server code.
  Schema validation is not authentication or authorization.
- Remove the prior generic agent helper; do not implement agents, tools, routes,
  storage, or frontend integration in this foundation.

## Consequences

- Servers must load environment values and explicitly initialize their model.
- Importing schemas is safe without credentials; the factory rejects browser use.
  This guard is not a substitute for keeping secrets out of client bundles.
- Schemas check structure, not whether cited facts exist, belong to the user, or
  support a claim. Future trusted orchestration must enforce ownership, reference
  integrity, confirmation provenance, and grounding before using model output.
- No live model calls or persistence are provided.

## Notes

Replaced by [0012: Consolidate model setup and configure defaults](0012-consolidate-model-setup-and-defaults.md).
The original no-default configuration policy below is historical; the remaining
foundation conventions are retained by the replacement.

Reference: https://github.com/Devscale-Indonesia/anvia-fullstack-app/tree/main/packages/agents

The installed adapter and core completion declarations were inspected before
implementation. This decision does not claim a credentialed model request passed.
