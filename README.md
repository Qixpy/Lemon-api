# Lemon API

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

## Endpoints (base `/api/v1`)

- Public: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- Health: `GET /health`, `GET /ready` (readiness probe with DB check)
- Protected: `GET /me`
- Items: `POST /items`, `GET /items?includeAll=true` (admin to see all), `GET /items/:id`, `PATCH /items/:id`, `DELETE /items/:id`
- Admin: `PATCH /admin/users/:id/role`

## Testing

The test suite runs in-process (spins up its own server instance), so the API does **not** need to be running separately.

**Prerequisites before testing:**
1. Database running (`docker compose up -d`)
2. Migrations applied (`npm run prisma:migrate`)
3. Database seeded (`npm run seed`)

**Run tests:**

```bash
npx tsx tests/testChecklist.ts
```

Results are written to `tests/test-results.json` with pass/fail counts and timestamps. All 33 tests validate:
- Health & readiness probes
- Security headers (helmet, CORS)
- Auth flows (register, login, refresh, logout)
- RBAC enforcement
- IDOR protection
- Token rotation and revocation
- Rate limiting
- Error formatting

**Note for Windows:** Use `curl.exe` instead of `curl` to avoid PowerShell's `Invoke-WebRequest` alias.

### Example cURL

**Windows users:** Use `curl.exe` instead of `curl` (PowerShell has a curl alias that behaves differently).

```bash
# register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"StrongPassw0rd!"}'

# login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"User123!ChangeMe"}'

# refresh
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh>"}'

# get me
curl http://localhost:3000/api/v1/me -H "Authorization: Bearer <access>"

# create item
curl -X POST http://localhost:3000/api/v1/items \
  -H "Authorization: Bearer <access>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My item","description":"demo"}'
```

## Threat Model / Assumptions

This API mitigates common threats but is not a complete security solution:

**Explicitly mitigated:**
- **IDOR attacks**: Owner-based access control; admin-only cross-tenant reads
- **Brute force**: Aggressive rate limiting on auth endpoints
- **Token reuse**: Refresh tokens are rotated; old tokens revoked and reuse attempts audited
- **Injection attacks**: Parameterized Prisma queries; Zod validation on all inputs
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

## Security notes

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
- `npm run prisma:migrate` — apply migrations (creates `init` on first run)
- `npm run prisma:generate` — generate Prisma client
- `npm run prisma:studio` — open Prisma Studio
- `npm run seed` — run Prisma seed
- `npx tsx tests/testChecklist.ts` — run test suite

---

Made by [vizrastudio - omer surucu](https://www.vizrastudio.com)
