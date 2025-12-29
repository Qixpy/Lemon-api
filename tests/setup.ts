import { beforeAll, afterAll, beforeEach } from "vitest";
import { resetDatabase, seedTestUsers, closeDatabase } from "./helpers";
import dotenv from "dotenv";

// Load test environment
dotenv.config();

// Override with test-specific values - DATABASE_URL is what Prisma uses
const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  process.env.DATABASE_URL ||
  "postgresql://lemon:lemon@localhost:5432/lemon_test";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = testDbUrl;
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "test_jwt_access_secret_min_24_chars";
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "test_refresh_secret_min_24_chars";
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || "";

beforeAll(async () => {
  // Apply migrations if needed (in CI, this should be done before tests)
  // await execSync('npx prisma migrate deploy', { stdio: 'inherit' });
});

beforeEach(async () => {
  await resetDatabase();
  await seedTestUsers();
});

afterAll(async () => {
  await closeDatabase();
});
