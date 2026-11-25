# 0003: Use Oxfmt for formatting

Status: accepted

## Context

The workspace uses a root formatter configuration to keep supported source and
documentation files consistent.

## Decision

- Use Oxfmt as a root development dependency, configured in `.oxfmtrc.json`.
- Configure no semicolons, single quotes, trailing commas wherever supported,
  two-space indentation, a print width of 100, and LF line endings.
- Provide `pnpm format` to write formatting changes and `pnpm format:check` to
  check without writing.
- Exclude dependencies, build output, generated route trees, the pnpm lockfile,
  and Playwright reports and test artifacts.
- Keep formatting separate from the pre-commit hook; the hook does not run either
  formatting command.

## Consequences

- Formatting is an explicit command rather than an automatic pre-commit rewrite.
- The pre-commit checks do not enforce formatting; contributors must run the
  formatting commands separately.
- Generated files remain under their generators' formatting conventions.

## Notes

Sources: `package.json`, `.oxfmtrc.json`, and `.husky/pre-commit`.
See [0004: Use Husky for pre-commit checks](0004-use-husky-for-pre-commit-checks.md)
for the configured commit gate.
