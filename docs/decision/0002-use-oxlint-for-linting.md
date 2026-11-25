# 0002: Use Oxlint for linting

Status: accepted

## Context

The workspace has TypeScript and React source code, plus root-level tooling and
tests. Linting is managed from the repository root.

## Decision

- Use Oxlint as a root development dependency, configured in `.oxlintrc.json`.
- Enable the TypeScript, Unicorn, Oxc, and React plugins, with the correctness
  category configured as errors.
- Run `oxlint --deny-warnings .` through `pnpm lint`; warnings fail the command.
- Provide `pnpm lint:fix` for available automatic fixes, also denying warnings.
- Exclude dependencies, build output, generated route trees, and Playwright
  reports and test artifacts.

## Consequences

- A root command checks the workspace rather than requiring per-package lint scripts.
- Generated output is not maintained through lint fixes.
- Linting does not enable Oxlint's type-aware or type-check flags; TypeScript
  checking remains a separate root command.

## Notes

Sources: `package.json` and `.oxlintrc.json`.
The pre-commit integration is documented in
[0004: Use Husky for pre-commit checks](0004-use-husky-for-pre-commit-checks.md).
