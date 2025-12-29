import { describe, it, expect } from "vitest";
import request from "supertest";
import { getTestApp, loginUser } from "./helpers";
import { prisma } from "../src/db/prisma";

describe("Admin - Role Change", () => {
  it("admin can change user role", async () => {
    const app = getTestApp();
    const { accessToken: adminToken } = await loginUser(
      "admin@example.com",
      "Admin123!ChangeMe"
    );
    const { userId } = await loginUser("user@example.com", "User123!ChangeMe");

    const res = await request(app)
      .patch(`/api/v1/admin/users/${userId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "ADMIN" })
      .expect(200);

    expect(res.body.data.user.role).toBe("ADMIN");

    // Verify audit event
    const auditEvent = await prisma.auditEvent.findFirst({
      where: {
        action: "ROLE_CHANGE",
        metadata: {
          path: ["targetUserId"],
          equals: userId,
        },
      },
    });
    expect(auditEvent).toBeDefined();
  });

  it("non-admin cannot change user role", async () => {
    const app = getTestApp();
    const { accessToken: userToken, userId } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );

    await request(app)
      .patch(`/api/v1/admin/users/${userId}/role`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ role: "ADMIN" })
      .expect(403);
  });

  it("invalid role is rejected", async () => {
    const app = getTestApp();
    const { accessToken: adminToken } = await loginUser(
      "admin@example.com",
      "Admin123!ChangeMe"
    );
    const { userId } = await loginUser("user@example.com", "User123!ChangeMe");

    await request(app)
      .patch(`/api/v1/admin/users/${userId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "SUPERUSER" })
      .expect(400);
  });

  it("role change to non-existent user returns 404 and audit event", async () => {
    const app = getTestApp();
    const { accessToken: adminToken } = await loginUser(
      "admin@example.com",
      "Admin123!ChangeMe"
    );

    await request(app)
      .patch("/api/v1/admin/users/00000000-0000-0000-0000-000000000000/role")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "ADMIN" })
      .expect(404);

    // Verify audit event for failure
    const auditEvent = await prisma.auditEvent.findFirst({
      where: {
        action: "ROLE_CHANGE_FAILURE",
        metadata: {
          path: ["reason"],
          equals: "user_not_found",
        },
      },
    });
    expect(auditEvent).toBeDefined();
  });
});
