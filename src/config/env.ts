import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().nonnegative().max(65535).default(3000),
  DATABASE_URL: z.string().url().min(1),
  JWT_ACCESS_SECRET: z.string().min(24),
  REFRESH_TOKEN_SECRET: z.string().min(24),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(300000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment variables");
}

const env = parsed.data;

// Detect weak/shared secrets
const weakSecrets = [
  "secret",
  "test",
  "changeme",
  "password",
  "default",
  "example",
];
if (
  env.NODE_ENV === "production" &&
  (weakSecrets.some((weak) =>
    env.JWT_ACCESS_SECRET.toLowerCase().includes(weak)
  ) ||
    weakSecrets.some((weak) =>
      env.REFRESH_TOKEN_SECRET.toLowerCase().includes(weak)
    ) ||
    env.JWT_ACCESS_SECRET === env.REFRESH_TOKEN_SECRET)
) {
  throw new Error(
    "Weak or shared secrets detected in production. Use strong, unique secrets."
  );
}

const corsOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  : [];

if (env.NODE_ENV === "production" && corsOrigins.length === 0) {
  throw new Error("CORS_ORIGINS must be configured in production");
}

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === "production",
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  jwtAccessSecret: env.JWT_ACCESS_SECRET,
  refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
  accessTokenTtlMinutes: env.ACCESS_TOKEN_TTL_MINUTES,
  refreshTokenTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
  corsOrigins,
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },
  authRateLimit: {
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX,
  },
};
