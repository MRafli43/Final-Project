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

| Status | Meaning |
| --- | --- |
| `accepted` | The decision is currently in effect. |
| `superseeded` | A newer decision replaces it. Link to the replacement record. |
| `deprecated` | The decision is no longer recommended or in effect, without a replacement. |

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

- [0001: Use a pnpm workspace](decision/0001-use-pnpm-workspace.md) — `accepted`

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
