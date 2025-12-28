# Lemon API — Test Results

Command: `npx tsx tests/testChecklist.ts` (in-process server, NODE_ENV=test, http logger disabled, rate limits relaxed: AUTH_RATE_LIMIT_MAX=1000, RATE_LIMIT_MAX=1000).

## Summary

All checklist items passed in this run.

## Detailed Results

- Health endpoint: PASS
- Security headers & no X-Powered-By: PASS
- Register validation (weak pwd / bad email / duplicate): PASS
- Register success response hygiene: PASS
- Login (success, wrong password, non-existent user): PASS
- Access token auth (missing, malformed, expired): PASS
- /me returns current user without sensitive fields: PASS
- Items (USER): create/list/get/patch/delete; validation enforced: PASS
- IDOR protections (other user item access, includeAll for user): PASS
- Admin permissions (includeAll list, CRUD any item): PASS
- Admin endpoint guard for non-admins: PASS
- Role change endpoint (valid role, admin-only, audit hook exercised): PASS
- Refresh token rotation (old refresh rejected after rotation): PASS
- Logout revokes refresh token (subsequent refresh fails): PASS
- Error format consistency: PASS
- CORS default denies unknown origins: PASS

## Notes

- Tests spin up the app in-process against the real Prisma/PostgreSQL setup.
- Rate limiting was relaxed for this test run to avoid 429s while exercising auth flows.
