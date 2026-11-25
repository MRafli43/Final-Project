# 0004: Use Husky for pre-commit checks

Status: accepted

## Context

The workspace has root lint, type-check, and build commands. The local commit
workflow runs these checks before allowing a commit to complete.

## Decision

- Use Husky as a root development dependency and initialize it through the root
  `prepare` script (`husky`).
- Configure `.husky/pre-commit` to run
  `pnpm lint && pnpm typecheck && pnpm build`.
- Run the checks sequentially, stopping at the first failed command.
- Check the whole workspace rather than limiting checks to staged files.
- Keep formatting and Playwright test execution outside this hook.

## Consequences

- With the hook installed and enabled, a failed lint, type-check, or build blocks
  the commit.
- Commits incur the cost of workspace-wide checks, including builds.
- The root type-check command also checks the Playwright configuration and test
  sources, but does not execute those tests.
- A successful hook does not establish formatting compliance or passing browser tests.

## Notes

Sources: `package.json` and `.husky/pre-commit`.
Related records:
[Oxlint](0002-use-oxlint-for-linting.md),
[Oxfmt](0003-use-oxfmt-for-formatting.md), and
[Playwright](0005-use-playwright-for-root-e2e-tests.md).
