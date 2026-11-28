# 0001: Use a pnpm workspace

Status: superseeded

Replaced by [0014](0014-simplify-source-only-agent-package.md) for logger removal.
The pnpm workspace conventions otherwise remain in effect.

## Context

The project needs an API, a web platform, and a shared logger in one repository.
Applications should be independently runnable while sharing packages and tooling.

## Decision

- Use pnpm workspaces with applications in `apps/` and shared packages in `packages/`.
- Build the API with Hono, Zod, and `@hono/zod-validator`.
- Build the platform with React, Vite, and TanStack Router's file-based routing.
- Provide a basic shared logger in `packages/logger/`.
- Use TypeScript across applications and packages.

## Consequences

- A single lockfile manages dependencies for the workspace.
- Workspace dependencies allow applications to consume shared packages locally.
- Shared packages must be built before consumers that use their compiled exports.
- Root scripts provide common development, build, and type-check commands.

## Notes

This record documents the existing workspace setup, not a product feature decision.
