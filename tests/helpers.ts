import { Express } from "express";
import { createApp, AppOptions } from "../src/app";
import { prisma } from "../src/db/prisma";
import { hashPassword } from "../src/utils/password";
import request from "supertest";

let testApp: Express;

export function getTestApp(options?: AppOptions): Express {
  if (!testApp) {
    testApp = createApp({
      enableHttpLogger: false,
      rateLimitConfig: {
        general: { windowMs: 1000, max: 100 },
        auth: { windowMs: 1000, max: 10 },
      },
      ...options,
    });
  }
  return testApp;
}

export async function resetDatabase() {
  const tables = ["AuditEvent", "RefreshToken", "Item", "User"];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }
}

export async function seedTestUsers() {
  const userPassword = await hashPassword("User123!ChangeMe");
  const adminPassword = await hashPassword("Admin123!ChangeMe");

  const user = await prisma.user.create({
    data: {
      email: "user@example.com",
      passwordHash: userPassword,
      role: "USER",
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  // Create test items
  await prisma.item.create({
    data: {
      ownerId: user.id,
      title: "User Item 1",
      description: "User owned item",
    },
  });

  await prisma.item.create({
    data: {
      ownerId: admin.id,
      title: "Admin Item 1",
      description: "Admin owned item",
    },
  });

  return { user, admin };
}

export async function registerUser(
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  const app = getTestApp();
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password })
    .expect((res) => {
      if (res.status !== 200 && res.status !== 201) {
        throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
      }
    });

  return {
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
    userId: res.body.data.user.id,
  };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  const app = getTestApp();
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password })
    .expect(200);

  return {
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
    userId: res.body.data.user.id,
  };
}

export async function closeDatabase() {
  await prisma.$disconnect();
}
