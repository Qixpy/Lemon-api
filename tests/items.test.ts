import { describe, it, expect } from "vitest";
import request from "supertest";
import { getTestApp, loginUser, registerUser } from "./helpers";
import { prisma } from "../src/db/prisma";

describe("Items CRUD - Authorization & IDOR Protection", () => {
  it("user can create own item", async () => {
    const app = getTestApp();
    const { accessToken } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );

    const res = await request(app)
      .post("/api/v1/items")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "My Item", description: "Test item" })
      .expect(201);

    expect(res.body.data.item.title).toBe("My Item");
  });

  it("user can list only own items", async () => {
    const app = getTestApp();
    const { accessToken, userId } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );

    const res = await request(app)
      .get("/api/v1/items")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data.items)).toBe(true);
    // Verify all items belong to user
    const allOwnedByUser = res.body.data.items.every(
      (item: any) => item.ownerId === userId
    );
    expect(allOwnedByUser).toBe(true);
  });

  it("user can read own item", async () => {
    const app = getTestApp();
    const { accessToken, userId } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );

    const userItem = await prisma.item.findFirst({
      where: { ownerId: userId },
    });

    await request(app)
      .get(`/api/v1/items/${userItem!.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  });

  it("user can update own item", async () => {
    const app = getTestApp();
    const { accessToken, userId } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );

    const userItem = await prisma.item.findFirst({
      where: { ownerId: userId },
    });

    const res = await request(app)
      .patch(`/api/v1/items/${userItem!.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Updated Title" })
      .expect(200);

    expect(res.body.data.item.title).toBe("Updated Title");
  });

  it("user can delete own item", async () => {
    const app = getTestApp();
    const { accessToken, userId } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );

    const userItem = await prisma.item.findFirst({
      where: { ownerId: userId },
    });

    await request(app)
      .delete(`/api/v1/items/${userItem!.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const deleted = await prisma.item.findUnique({
      where: { id: userItem!.id },
    });
    expect(deleted).toBeNull();
  });

  it("user cannot read another user's item (IDOR protection)", async () => {
    const app = getTestApp();
    const { accessToken: userToken } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );
    const { userId: adminUserId } = await loginUser(
      "admin@example.com",
      "Admin123!ChangeMe"
    );

    const adminItem = await prisma.item.findFirst({
      where: { ownerId: adminUserId },
    });

    await request(app)
      .get(`/api/v1/items/${adminItem!.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(404);
  });

  it("user cannot update another user's item", async () => {
    const app = getTestApp();
    const { accessToken: userToken } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );
    const { userId: adminUserId } = await loginUser(
      "admin@example.com",
      "Admin123!ChangeMe"
    );

    const adminItem = await prisma.item.findFirst({
      where: { ownerId: adminUserId },
    });

    await request(app)
      .patch(`/api/v1/items/${adminItem!.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "Hacked" })
      .expect(404);
  });

  it("user cannot delete another user's item", async () => {
    const app = getTestApp();
    const { accessToken: userToken } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );
    const { userId: adminUserId } = await loginUser(
      "admin@example.com",
      "Admin123!ChangeMe"
    );

    const adminItem = await prisma.item.findFirst({
      where: { ownerId: adminUserId },
    });

    await request(app)
      .delete(`/api/v1/items/${adminItem!.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(404);
  });

  it("user cannot use includeAll=true", async () => {
    const app = getTestApp();
    const { accessToken } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );

    await request(app)
      .get("/api/v1/items?includeAll=true")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(403);
  });

  it("admin can use includeAll=true to list all items", async () => {
    const app = getTestApp();
    const { accessToken } = await loginUser(
      "admin@example.com",
      "Admin123!ChangeMe"
    );

    const res = await request(app)
      .get("/api/v1/items?includeAll=true")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.items.length).toBeGreaterThan(1);
  });

  it("admin can read any user's item", async () => {
    const app = getTestApp();
    const { accessToken: adminToken } = await loginUser(
      "admin@example.com",
      "Admin123!ChangeMe"
    );
    const { userId: userUserId } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );

    const userItem = await prisma.item.findFirst({
      where: { ownerId: userUserId },
    });

    await request(app)
      .get(`/api/v1/items/${userItem!.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
  });

  it("admin can update any user's item", async () => {
    const app = getTestApp();
    const { accessToken: adminToken } = await loginUser(
      "admin@example.com",
      "Admin123!ChangeMe"
    );
    const { userId: userUserId } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );

    const userItem = await prisma.item.findFirst({
      where: { ownerId: userUserId },
    });

    await request(app)
      .patch(`/api/v1/items/${userItem!.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Admin Edit" })
      .expect(200);
  });

  it("admin can delete any user's item", async () => {
    const app = getTestApp();
    const { accessToken: adminToken } = await loginUser(
      "admin@example.com",
      "Admin123!ChangeMe"
    );
    const { userId: userUserId } = await loginUser(
      "user@example.com",
      "User123!ChangeMe"
    );

    const userItem = await prisma.item.findFirst({
      where: { ownerId: userUserId },
    });

    await request(app)
      .delete(`/api/v1/items/${userItem!.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
  });
});
