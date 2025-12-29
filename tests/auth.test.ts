import { describe, it, expect } from "vitest";
import request from "supertest";
import { getTestApp, loginUser, registerUser } from "./helpers";
import { prisma } from "../src/db/prisma";
import { hashRefreshToken } from "../src/utils/tokens";

describe("Authentication - Register & Login", () => {
  it("register: rejects invalid email", async () => {
    const app = getTestApp();
    await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "not-an-email", password: "StrongPassw0rd!" })
      .expect(400);
  });

  it("register: rejects weak password", async () => {
    const app = getTestApp();
    await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "test@example.com", password: "weak" })
      .expect(400);
  });

  it("register: rejects duplicate email", async () => {
    const app = getTestApp();
    await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "user@example.com", password: "StrongPassw0rd!" })
      .expect(409);
  });

  it("register: success returns tokens and user", async () => {
    const app = getTestApp();
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `new${Date.now()}@example.com`,
        password: "StrongPassw0rd!",
      })
      .expect(201);

    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("login: success returns tokens", async () => {
    const app = getTestApp();
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "user@example.com", password: "User123!ChangeMe" })
      .expect(200);

    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it("login: wrong password returns 401", async () => {
    const app = getTestApp();
    await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "user@example.com", password: "WrongPassword!" })
      .expect(401);
  });

  it("login: non-existent user returns 401", async () => {
    const app = getTestApp();
    await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "ghost@example.com", password: "StrongPassw0rd!" })
      .expect(401);
  });
});

describe("Authentication - Refresh Token Rotation & Reuse Detection", () => {
  it("refresh: rotates token and invalidates old one", async () => {
    const app = getTestApp();
    const { accessToken, refreshToken } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );

    // Refresh once
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(200);

    const newRefreshToken = res.body.data.refreshToken;
    expect(newRefreshToken).toBeDefined();
    expect(newRefreshToken).not.toBe(refreshToken);

    // Try to reuse old token - should fail
    await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(401);

    // Verify audit event for reuse attempt exists
    const auditEvents = await prisma.auditEvent.findMany({
      where: { action: "TOKEN_REUSE_ATTEMPT" },
    });
    expect(auditEvents.length).toBeGreaterThan(0);
  });

  it("refresh: token stored as hash, not plaintext", async () => {
    const { refreshToken } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );

    const hashed = hashRefreshToken(refreshToken);
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: { tokenHash: hashed },
    });

    expect(tokenRecord).toBeDefined();
    expect(tokenRecord!.tokenHash).not.toBe(refreshToken);
    expect(tokenRecord!.tokenHash.length).toBe(64); // SHA-256 hex
  });

  it("logout: revokes refresh token", async () => {
    const app = getTestApp();
    const { accessToken, refreshToken } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );

    await request(app)
      .post("/api/v1/auth/logout")
      .send({ refreshToken })
      .expect(200);

    // Try to refresh with revoked token
    await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(401);
  });
});

describe("Authentication - /me Endpoint", () => {
  it("missing token returns 401", async () => {
    const app = getTestApp();
    await request(app).get("/api/v1/me").expect(401);
  });

  it("valid token returns user data without passwordHash", async () => {
    const app = getTestApp();
    const { accessToken } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );

    const res = await request(app)
      .get("/api/v1/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.user.email).toBe("user@example.com");
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("invalid token returns 401", async () => {
    const app = getTestApp();
    await request(app)
      .get("/api/v1/me")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);
  });
});
