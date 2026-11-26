# Documentation

## Structure

```text
docs/
  decision/    Technical and architectural decisions
  product/     Product decisions and notes
  README.md    Documentation index and conventions
```

## Naming

Use `XXXX-meaningful-name.md`, with a four-digit sequential number and a short,
lowercase, hyphen-separated name. Number each directory independently, starting
at `0001`. Keep existing numbers and filenames stable when updating a record.

## Decision records

Capture the context, decision, and consequences of technical or architectural
choices in `decision/`.

Every decision must have exactly one of these statuses:

| Status        | Meaning                                                                    |
| ------------- | -------------------------------------------------------------------------- |
| `accepted`    | The decision is currently in effect.                                       |
| `superseeded` | A newer decision replaces it. Link to the replacement record.              |
| `deprecated`  | The decision is no longer recommended or in effect, without a replacement. |

When replacing a decision, keep the original record, mark it `superseeded`, and
link both records. When deprecating one, explain why in its notes.

### Template

```markdown
# XXXX: Meaningful decision title

Status: accepted

## Context

What problem or constraint prompted this decision?

## Decision

What was chosen, and why?

## Consequences

What benefits, tradeoffs, and follow-up work result?

## Notes

Related records, replacement links, or deprecation rationale.
```

### Index

- [0001: Use a pnpm workspace](decision/0001-use-pnpm-workspace.md) — `superseeded`
- [0002: Use Oxlint for linting](decision/0002-use-oxlint-for-linting.md) — `accepted`
- [0003: Use Oxfmt for formatting](decision/0003-use-oxfmt-for-formatting.md) — `accepted`
- [0004: Use Husky for pre-commit checks](decision/0004-use-husky-for-pre-commit-checks.md) — `accepted`
- [0005: Use Playwright for root E2E tests](decision/0005-use-playwright-for-root-e2e-tests.md) — `accepted`
- [0006: Remove the Pullfrog workflow](decision/0006-remove-pullfrog-workflow.md) — `accepted`
- [0007: Add a basic agents package](decision/0007-add-basic-agents-package.md) — `superseeded`
- [0008: Establish the Anvia agent foundation](decision/0008-establish-anvia-agent-foundation.md) — `superseeded`
- [0009: Add scoped read-only tools and Node unit tests](decision/0009-add-scoped-read-only-tools.md) — `superseeded`
- [0010: Add a single agent with a fixed workflow](decision/0010-add-single-agent-fixed-workflow.md) — `superseeded`
- [0011: Add mandatory draft verification and opt-in smoke execution](decision/0011-add-mandatory-draft-verification.md) — `superseeded`
- [0012: Consolidate model setup and configure defaults](decision/0012-consolidate-model-setup-and-defaults.md) — `superseeded`
- [0013: Consolidate Agent setup and add a stream entry point](decision/0013-consolidate-agent-stream-entry-point.md) — `superseeded`
- [0014: Simplify to a source-only agent package](decision/0014-simplify-source-only-agent-package.md) — `superseeded`
- [0015: Add self-hosted Lens infrastructure](decision/0015-add-self-hosted-lens-infrastructure.md) — `accepted`
- [0016: Add public web search through Tavily](decision/0016-add-public-web-search-tool.md) — `superseeded`
- [0017: Remove agent tools and the product prompt](decision/0017-remove-agent-tools-and-product-prompt.md) — `superseeded`
- [0018: Add an evidence-based job recommendation pipeline](decision/0018-add-job-recommendation-pipeline.md) — `accepted`

## Product records

Capture product choices in `product/`. Each record contains a **Product decision**
section describing the choice and a **Notes** section for supporting context,
constraints, and open questions. Product records do not use the technical
decision status field.

### Template

```markdown
# XXXX: Meaningful product title

## Product decision

What should the product do, for whom, and why?

## Notes

Supporting context, constraints, and open questions.
```

### Index

- [0001: Product scope](product/0001-product-scope.md)
