# 0005: Use Playwright for root E2E tests

Status: accepted

## Context

The platform consumes the API through Vite's development proxy. Root-level tests
exercise the browser interface and API requests through that shared entry point.

## Decision

- Use `@playwright/test` as a root development dependency, with
  `playwright.config.ts` and tests in `e2e/`.
- Configure one Chromium project using the Desktop Chrome device preset and
  `http://127.0.0.1:5173` as the base URL.
- Let Playwright manage the API and platform development servers. The API uses
  port 3000 and `/api/health` for readiness; Vite uses host `127.0.0.1`, port 5173,
  and strict port selection. Each server has a 120-second startup timeout.
- Reuse existing servers locally, but not when `CI` is set.
- Enable fully parallel tests. Under `CI`, forbid focused tests, allow two
  retries, and use one worker; locally, use no retries and the default worker count.
- Use list and HTML reporters without automatically opening the HTML report.
  Retain traces on failure and capture screenshots only on failure.
- Provide root commands for standard, UI, and headed execution, plus HTML report viewing.
- Include the configuration and test sources in `tsconfig.e2e.json`, checked by
  the root type-check command without emitting files.
- Ignore Playwright reports and test artifacts in Git, linting, and formatting.

## Consequences

- Tests exercise the development-server integration, not a production deployment.
- The configured browser coverage is Chromium only, and execution requires its
  Playwright browser installation.
- Existing local servers can influence local results; CI does not reuse them.
- Browser tests run separately from the pre-commit lint, type-check, and build gate.
- Failure artifacts support investigation without being committed to the repository.

## Notes

Sources: `package.json`, `playwright.config.ts`, `tsconfig.e2e.json`, `e2e/`,
`.gitignore`, `.oxlintrc.json`, and `.oxfmtrc.json`.

The existing tests cover API health, a personalized greeting, empty-name rejection,
the home page greeting, navigation, and reloading the About route. API checks use
the platform's `/api` proxy. This record describes configuration and coverage,
not a claim that browser tests have passed.
