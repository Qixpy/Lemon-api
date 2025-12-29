# Lemon API

[![CI](https://github.com/Qixpy/Lemon-api/actions/workflows/ci.yml/badge.svg)](https://github.com/Qixpy/Lemon-api/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Qixpy/Lemon-api/actions/workflows/codeql.yml/badge.svg)](https://github.com/Qixpy/Lemon-api/actions/workflows/codeql.yml)
[![Dependency Review](https://github.com/Qixpy/Lemon-api/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/Qixpy/Lemon-api/actions/workflows/dependency-review.yml)

Secure, production-style REST API built with Express, TypeScript, Prisma, PostgreSQL, JWT auth, and RBAC.

## Features

- JWT access + rotating refresh tokens, stored as hashes
- RBAC (USER, ADMIN) and bearer auth middleware
- Strong validation via Zod; centralized error responses `{ error: { code, message, requestId } }`
- Rate limiting (general + aggressive on auth)
- Security headers (helmet), strict CORS allowlist, x-powered-by disabled
- Audit logging for auth events, admin actions, item CRUD, token reuse attempts
- CRUD demo resource `items` with ownership checks and IDOR protection
- Pino logging with per-request requestId correlation
- Readiness probe for orchestration health checks
- Rejects obviously weak secrets in production
- Trust proxy for accurate rate limiting behind load balancers

## Production Enhancements

- **Config hardening**: Rejects weak secrets ("test", "changeme", etc.) and enforces CORS in production
- **Extended auditing**: Tracks item operations, access denials, admin failures, and token misuse
- **Configurable limiters**: Injectable rate limit factory for test-friendly configuration
- **Readiness probe**: `/ready` endpoint validates database connectivity
- **Options API**: `createApp({ enableHttpLogger?, rateLimitConfig? })` eliminates env mutation
- **JSON test output**: Structured test results in `tests/test-results.json`

## Prerequisites

- Node.js 20+
- Docker + docker-compose

## Setup

1. Install deps

```bash
npm install
```

2. Copy env

```bash
# Linux/macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env

# Edit secrets and DATABASE_URL as needed
```

3. Start Postgres

```bash
docker compose up -d
```

4. Prisma generate + migrate + seed

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

5. Run the API

```bash
npm run dev   # hot reload
# or
npm run build && npm start
```

## Endpoints

Base path: `/api/v1`

**Health checks:**

- `GET /health` — Process up
- `GET /ready` — Database reachable

**Public:**

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

**Protected:**

- `GET /me`

**Items:**

- `POST /items`
- `GET /items?includeAll=true` (admin to see all)
- `GET /items/:id`
- `PATCH /items/:id`
- `DELETE /items/:id`

**Admin:**

- `PATCH /admin/users/:id/role`

## Testing

The test suite uses **Vitest** and **supertest** for in-process HTTP testing. Tests run against a separate test database and do **not** require the API server to be running separately.

### Prerequisites before testing

1. **Test database running**: `docker compose up -d`
2. **Create test database**:

   ```bash
   # Linux/macOS
   psql -U lemon -h localhost -d postgres -c "CREATE DATABASE lemon_test;"

   # Windows (using docker exec)
   docker exec -it lemon-api-postgres-1 psql -U lemon -d postgres -c "CREATE DATABASE lemon_test;"
   ```

3. **Apply migrations to test database**:

   ```bash
   # Set DATABASE_URL_TEST temporarily for migration
   # Linux/macOS
   DATABASE_URL=postgresql://lemon:lemon@localhost:5432/lemon_test npm run prisma:migrate

   # Windows PowerShell
   $env:DATABASE_URL="postgresql://lemon:lemon@localhost:5432/lemon_test"; npm run prisma:migrate
   ```

### Run tests

```bash
# Run all tests once
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Generate JSON report (tests/test-results.json)
npm run test:report
```

### Test Coverage

The suite includes 39 security-focused tests covering:

- **Health checks**: `/health` and `/ready` endpoints
- **Security headers**: helmet headers, CORS, x-powered-by removal
- **Authentication**:
  - Registration (validation, duplicates)
  - Login (success, failures)
  - Refresh token rotation and reuse detection
  - Token hashing (SHA-256, never plaintext)
  - Logout and token revocation
  - `/me` endpoint authorization
- **Items CRUD**:
  - Create, read, update, delete operations
  - IDOR protection (users cannot access others' items)
  - Admin `includeAll` query
  - Admin cross-tenant access
- **Admin operations**:
  - Role changes with audit trails
  - Permission enforcement
  - Error handling
- **Error handling**: Consistent error format, requestId correlation
- **Rate limiting**: Auth and general limiters with deterministic test config

### Continuous Integration

GitHub Actions CI runs automatically on push/PR:

- Sets up Node 20 + PostgreSQL 16
- Runs migrations
- Executes full test suite
- Uploads test results as artifacts

See [.github/workflows/ci.yml](.github/workflows/ci.yml) for details.

## Security Automation

This project implements multiple layers of automated security scanning and monitoring:

### Static Application Security Testing (SAST)

**CodeQL** performs deep semantic code analysis to detect security vulnerabilities:

- Runs on every push and PR to main
- Weekly scheduled scans
- Detects common vulnerabilities: SQL injection, XSS, authentication bypasses, etc.
- Uses `security-extended` query suite for comprehensive coverage

See [.github/workflows/codeql.yml](.github/workflows/codeql.yml) for configuration.

### Software Composition Analysis (SCA)

**Dependabot** monitors dependencies for known vulnerabilities:

- Automatically scans npm packages and GitHub Actions
- Weekly checks for updates
- Groups minor/patch updates to reduce PR noise
- Opens PRs with security patches when vulnerabilities are discovered

See [.github/dependabot.yml](.github/dependabot.yml) for configuration.

### Dependency Review

**Dependency Review Action** blocks vulnerable dependencies in pull requests:

- Fails PRs that introduce high/critical severity vulnerabilities
- Blocks GPL-2.0 and GPL-3.0 licensed dependencies
- Provides detailed summary in PR comments

See [.github/workflows/dependency-review.yml](.github/workflows/dependency-review.yml) for configuration.

### Vulnerability Reporting

Please report security issues responsibly via GitHub Security Advisories. See [SECURITY.md](SECURITY.md) for details.

### Branch Protection (Recommended)

To enforce quality gates, configure branch protection rules for `main`:

1. Navigate to: **Settings** → **Branches** → **Branch protection rules**
2. Add rule for `main` branch with:
   - ✅ Require status checks to pass before merging
     - Required checks: `test`, `analyze (CodeQL)`, `dependency-review`
   - ✅ Require branches to be up to date before merging
   - ✅ Require linear history (optional, prevents merge commits)
   - ✅ Do not allow bypassing the above settings

This ensures:

- All tests pass before merge
- CodeQL finds no new security issues
- No vulnerable dependencies are introduced
- Code has been reviewed

### Example cURL

**Windows users:** Use `curl.exe` (PowerShell has a curl alias that behaves differently).

```bash
# register
curl.exe -X POST http://localhost:3000/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"new@example.com\",\"password\":\"StrongPassw0rd!\"}"

# login
curl.exe -X POST http://localhost:3000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"user@example.com\",\"password\":\"User123!ChangeMe\"}"

# refresh
curl.exe -X POST http://localhost:3000/api/v1/auth/refresh ^
  -H "Content-Type: application/json" ^
  -d "{\"refreshToken\":\"<refresh>\"}"

# get me
curl.exe http://localhost:3000/api/v1/me -H "Authorization: Bearer <access>"

# create item
curl.exe -X POST http://localhost:3000/api/v1/items ^
  -H "Authorization: Bearer <access>" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"My item\",\"description\":\"demo\"}"
```

## Threat Model

This API mitigates common threats but is not a complete security solution:

**Explicitly mitigated:**

- **IDOR attacks**: Owner-based access control; admin-only cross-tenant reads
- **Brute force**: Aggressive rate limiting on auth endpoints
- **Token reuse**: Refresh tokens are rotated; old tokens revoked and reuse attempts audited
- **Injection risk**: Reduced via Prisma parameterization + strict Zod validation on all inputs
- **Common misconfigurations**: Enforces CORS in production; rejects obviously weak secrets

**Not covered (requires additional implementation):**

- Multi-factor authentication (MFA/2FA)
- Device fingerprinting or binding
- Advanced anomaly detection (geo-blocking, behavior analysis)
- Account lockout after N failed attempts
- Email verification or password reset flows

**Assumptions:**

- Secrets are securely managed (env vars, vaults) and rotated periodically
- Application runs behind TLS termination (HTTPS enforced by infrastructure)
- Database backups and disaster recovery are handled at infrastructure level

## Security Notes

- No secrets in repo; supply via env.
- Minimum 24-character secrets enforced; obviously weak secrets (e.g., "test", "changeme") rejected in production.
- Access tokens last `ACCESS_TOKEN_TTL_MINUTES` (default 15m). Refresh tokens last `REFRESH_TOKEN_TTL_DAYS` (default 30d) and are rotated on refresh; old tokens are revoked.
- **Refresh tokens are never stored**; only derived HMAC SHA-256 hashes are stored in the database.
- Token reuse attempts are audited and blocked.
- Passwords hashed with argon2.
- CORS disabled unless `CORS_ORIGINS` is set (comma-separated allowlist); required in production.
- Aggressive rate limits on auth routes; general limit on all API routes.
- Centralized error handling; no stack traces in production responses.
- Audit events recorded for login success/failure, token refresh/reuse, logout, role changes, and item CRUD; never store raw tokens or passwords in metadata.
- Empty update payloads rejected (at least one field required).
- Trust proxy enabled for accurate IP tracking behind load balancers.

## Seeding

Creates:

- admin@example.com / Admin123!ChangeMe (ADMIN)
- user@example.com / User123!ChangeMe (USER)
- Demo items for both users

## Scripts

- `npm run dev` — start in watch mode
- `npm run build` — compile TypeScript
- `npm start` — run compiled build
- `npm test` — run all tests once
- `npm run test:watch` — run tests in watch mode
- `npm run test:report` — run tests and generate JSON report
- `npm run prisma:migrate` — apply migrations (creates `init` on first run)
- `npm run prisma:generate` — generate Prisma client
- `npm run prisma:studio` — open Prisma Studio
- `npm run seed` — run Prisma seed

---

Made by [VizraStudio — Omer Surucu](https://www.vizrastudio.com)
