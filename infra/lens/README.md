# Self-hosted Anvia Lens

Uses the unmodified published Lens **v0.20.1** Docker Compose configuration:
https://docs.anvia.dev/lens/self-hosting/deployment.html

## Configure before starting

From the repository root, in PowerShell:

```powershell
Set-Location infra/lens
Copy-Item .env.example .env # only if .env does not already exist
```

Populate every blank secret in `.env` with an independent cryptographically random
value. For each hex secret, run `openssl rand -hex 32` in a private terminal.
For the alert key, prefix an independent `openssl rand -base64 32` value with
`lens-key-1:`. Never reuse application API keys or commit `.env`. The repository's
existing ignore rules cover `infra/lens/.env`. Keep these infrastructure secrets
separate from the application root `.env`.

The example binds only `127.0.0.1:8080`. Both origin settings must match the browser
URL exactly. The release Compose file defaults to latest if LENS_VERSION is absent,
so always use the supplied numeric version setting.

The documented deployment expects Linux Docker containers. On Windows use a Linux
Docker Desktop engine; the monitor's `/proc`, `/`, and `/var/lib/docker` bind mounts
refer to Linux host/VM resources and may require platform-specific troubleshooting.
Do not expose this stack publicly without HTTPS and appropriate access controls.

## Start and inspect (only after configuration)

```powershell
docker version
docker compose version
docker compose --env-file .env config --quiet
docker compose --env-file .env pull
docker compose --env-file .env up -d
docker compose --env-file .env ps --all
Invoke-RestMethod http://localhost:8080/health/live
Invoke-RestMethod http://localhost:8080/health/ready
```

Dashboard: **http://localhost:8080** once the stack is healthy. The first account
created becomes workspace owner. A completed `migrate` container with exit code 0
is expected. Readiness does not prove worker processing; also check System Health.
Avoid printing resolved Compose configuration because it contains secrets.

Stop without deleting data with `docker compose --env-file .env down`. Never add
`-v` during routine stops: named volumes contain PostgreSQL, ClickHouse, and Redis
data. No seed/demo profile, SDK tracing integration, or model API calls are enabled.
