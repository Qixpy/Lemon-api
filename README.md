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
- Weak/shared secret detection in production
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

```
npm install
```

2. Copy env

```
cp .env.example .env
# edit secrets and DATABASE_URL if needed
```

3. Start Postgres

```
docker compose up -d
```

4. Prisma generate + migrate + seed

```
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

5. Run the API

```
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

Run the in-process test suite:

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

### Example cURL

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

## Security notes

- No secrets in repo; supply via env.
- Minimum 24-character secrets enforced; weak/shared secrets rejected in production.
- Access tokens last `ACCESS_TOKEN_TTL_MINUTES` (default 15m). Refresh tokens last `REFRESH_TOKEN_TTL_DAYS` (default 30d) and are rotated on refresh; old tokens are revoked.
- Token reuse attempts are audited and blocked.
- Passwords hashed with argon2; refresh tokens stored only as HMAC SHA-256 hashes.
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
