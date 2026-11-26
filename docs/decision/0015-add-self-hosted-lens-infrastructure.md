# 0015: Add self-hosted Lens infrastructure

Status: accepted

## Context

Lens hosting was outstanding after the simplified agent baseline. A local Docker
Compose installation is now requested without changing agent behavior or enabling
telemetry capture.

## Decision

- Add the unmodified v0.20.1 production docker-compose.yml from anvia-hq/lens in
  infra/lens, matching the release recommended by the Lens deployment docs.
- Supply a separate infrastructure .env.example with version 0.20.1, matching
  localhost origins, a loopback-only web binding on port 8080, and blank secrets.
- Use an ignored infra/lens/.env for independent database/auth/ingestion/alert
  secrets. Do not reuse the application root environment or model credentials.
- Check Docker and configuration before startup. Stop if the daemon is unavailable
  or required configuration is missing; do not invent credentials or start with
  placeholders. Do not print resolved secrets.
- Preserve named volumes and normal migration/healthcheck ordering. Do not enable
  demo seeds, external ingress, SDK instrumentation, or model calls.

## Consequences

- Local configuration is required before starting containers. Windows Docker
  Desktop must use Linux containers; monitor host mounts need compatible support.
- Hosting alone does not implement agent tracing, privacy/retention policy, or
  evaluations. Those integrations remain outstanding under 0014.
- The first registered account becomes owner; secure bootstrap before any public
  access. Production hosting also needs HTTPS, backups, and capacity planning.

## Notes

Extends [0014](0014-simplify-source-only-agent-package.md) for infrastructure only.
Source: https://docs.anvia.dev/lens/self-hosting/deployment.html
Release: https://github.com/anvia-hq/lens/tree/v0.20.1
