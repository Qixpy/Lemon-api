process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.PORT = process.env.PORT || "0";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "test_access_secret_very_long";
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "test_refresh_secret_very_long";

import jwt from "jsonwebtoken";
import { createServer } from "http";
import { AddressInfo } from "net";
import fs from "fs";

let base = "";
let config: any;

type Result = { name: string; pass: boolean; details?: string };
const results: Result[] = [];

async function main() {
  const { createApp } = await import("../src/app");
  const envModule = await import("../src/config/env");
  config = envModule.config;

  const app = createApp({
    enableHttpLogger: false,
    rateLimitConfig: {
      general: { windowMs: 60000, max: 1000 },
      auth: { windowMs: 60000, max: 1000 },
    },
  });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as AddressInfo;
  base = `http://127.0.0.1:${address.port}`;

  await test("Health", async () => {
    const res = await fetch(`${base}/health`);
    const data = await res.json();
    expect(res.status === 200, `status ${res.status}`);
    expect(data.status === "ok", "bad body");
    expect(res.headers.get("x-request-id"), "missing request id");
  });

  await test("Readiness probe", async () => {
    const res = await fetch(`${base}/ready`);
    const data = await res.json();
    expect(res.status === 200, `status ${res.status}`);
    expect(data.status === "ready", "not ready");
  });

  await test("Security headers", async () => {
    const res = await fetch(`${base}/health`);
    expect(!!res.headers.get("x-dns-prefetch-control"), "missing dns header");
    expect(!!res.headers.get("x-frame-options"), "missing frame header");
    expect(!!res.headers.get("x-content-type-options"), "missing ctype header");
    expect(
      !!res.headers.get("cross-origin-resource-policy"),
      "missing corp header"
    );
    expect(!res.headers.get("x-powered-by"), "x-powered-by present");
  });

  const uniqueEmail = `new${Date.now()}@example.com`;

  await test("Register weak password rejected", async () => {
    const res = await post("/api/v1/auth/register", {
      email: `weak${Date.now()}@example.com`,
      password: "weak",
    });
    expect(res.status === 400, `status ${res.status}`);
  });

  await test("Register invalid email rejected", async () => {
    const res = await post("/api/v1/auth/register", {
      email: "not-an-email",
      password: "StrongPassw0rd!",
    });
    expect(res.status === 400, `status ${res.status}`);
  });

  await test("Register duplicate email rejected", async () => {
    const res = await post("/api/v1/auth/register", {
      email: "user@example.com",
      password: "User123!ChangeMe",
    });
    expect(
      res.status === 409 || res.status === 400 || res.status === 401,
      `status ${res.status}`
    );
  });

  let userAccess = "";
  let userRefresh = "";
  let userId = "";

  await test("Register success", async () => {
    const res = await post("/api/v1/auth/register", {
      email: uniqueEmail,
      password: "VeryStrong1!Pass",
    });
    const body = await res.json();
    expect(res.status === 201 || res.status === 200, `status ${res.status}`);
    expect(body.data.user.email === uniqueEmail, "email mismatch");
    expect(!("passwordHash" in body.data.user), "leaked passwordHash");
  });

  await test("Login success", async () => {
    const res = await post("/api/v1/auth/login", {
      email: "user@example.com",
      password: "User123!ChangeMe",
    });
    const body = await res.json();
    expect(res.status === 200, `status ${res.status}`);
    userAccess = body.data.accessToken;
    userRefresh = body.data.refreshToken;
    userId = body.data.user.id;
    expect(!!userAccess && !!userRefresh, "missing tokens");
  });

  await test("Login wrong password", async () => {
    const res = await post("/api/v1/auth/login", {
      email: "user@example.com",
      password: "WrongPass!1",
    });
    expect(res.status === 401, `status ${res.status}`);
  });

  await test("Login non-existent", async () => {
    const res = await post("/api/v1/auth/login", {
      email: "ghost@example.com",
      password: "StrongPassw0rd!",
    });
    expect(res.status === 401, `status ${res.status}`);
  });

  await test("/me missing token", async () => {
    const res = await fetch(`${base}/api/v1/me`);
    expect(res.status === 401, `status ${res.status}`);
  });

  await test("Malformed bearer token", async () => {
    const res = await fetch(`${base}/api/v1/me`, {
      headers: { Authorization: "Bearer abc" },
    });
    expect(res.status === 401, `status ${res.status}`);
  });

  await test("Expired token", async () => {
    const expired = jwt.sign(
      {
        sub: userId || "temp",
        role: "USER",
        exp: Math.floor(Date.now() / 1000) - 10,
      },
      config.jwtAccessSecret
    );
    const res = await fetch(`${base}/api/v1/me`, {
      headers: { Authorization: `Bearer ${expired}` },
    });
    expect(res.status === 401, `status ${res.status}`);
  });

  await test("/me with valid token", async () => {
    const res = await fetch(`${base}/api/v1/me`, {
      headers: { Authorization: `Bearer ${userAccess}` },
    });
    const body = await res.json();
    expect(res.status === 200, `status ${res.status}`);
    expect(body.data.user.email === "user@example.com", "email mismatch");
    expect(!("passwordHash" in body.data.user), "leaked passwordHash");
  });

  let itemA = "";
  let itemB = "";

  await test("Create item (user)", async () => {
    const res = await post(
      "/api/v1/items",
      { title: "Item A", description: "user item" },
      userAccess
    );
    const body = await res.json();
    expect(res.status === 201, `status ${res.status}`);
    itemA = body.data.item.id;
  });

  await test("List own items", async () => {
    const res = await fetch(`${base}/api/v1/items`, {
      headers: { Authorization: `Bearer ${userAccess}` },
    });
    const body = await res.json();
    expect(res.status === 200, `status ${res.status}`);
    const nonOwned = body.data.items.filter((i: any) => i.ownerId !== userId);
    expect(nonOwned.length === 0, "saw others items");
  });

  await test("Get own item", async () => {
    const res = await fetch(`${base}/api/v1/items/${itemA}`, {
      headers: { Authorization: `Bearer ${userAccess}` },
    });
    expect(res.status === 200, `status ${res.status}`);
  });

  await test("Patch own item", async () => {
    const res = await patch(
      `/api/v1/items/${itemA}`,
      { title: "Item A updated" },
      userAccess
    );
    expect(res.status === 200, `status ${res.status}`);
  });

  await test("Delete own item", async () => {
    const res = await del(`/api/v1/items/${itemA}`, userAccess);
    expect(res.status === 200, `status ${res.status}`);
  });

  await test("Create item for admin cross-check", async () => {
    const res = await post(
      "/api/v1/items",
      { title: "Item B", description: "user item B" },
      userAccess
    );
    const body = await res.json();
    expect(res.status === 201, `status ${res.status}`);
    itemB = body.data.item.id;
  });

  await test("User IDOR on admin item blocked", async () => {
    const res = await fetch(
      `${base}/api/v1/items/11111111-1111-1111-1111-111111111111`,
      { headers: { Authorization: `Bearer ${userAccess}` } }
    );
    expect(res.status === 404, `status ${res.status}`);
  });

  await test("User includeAll forbidden", async () => {
    const res = await fetch(`${base}/api/v1/items?includeAll=true`, {
      headers: { Authorization: `Bearer ${userAccess}` },
    });
    expect(res.status === 403, `status ${res.status}`);
  });

  let adminAccess = "";
  let adminRefresh = "";

  await test("Admin login", async () => {
    const res = await post("/api/v1/auth/login", {
      email: "admin@example.com",
      password: "Admin123!ChangeMe",
    });
    const body = await res.json();
    expect(res.status === 200, `status ${res.status}`);
    adminAccess = body.data.accessToken;
    adminRefresh = body.data.refreshToken;
  });

  await test("Admin list includeAll", async () => {
    const res = await fetch(`${base}/api/v1/items?includeAll=true`, {
      headers: { Authorization: `Bearer ${adminAccess}` },
    });
    expect(res.status === 200, `status ${res.status}`);
  });

  await test("Admin get user item", async () => {
    const res = await fetch(`${base}/api/v1/items/${itemB}`, {
      headers: { Authorization: `Bearer ${adminAccess}` },
    });
    expect(res.status === 200, `status ${res.status}`);
  });

  await test("Admin patch user item", async () => {
    const res = await patch(
      `/api/v1/items/${itemB}`,
      { title: "Admin edited" },
      adminAccess
    );
    expect(res.status === 200, `status ${res.status}`);
  });

  await test("Admin delete user item", async () => {
    const res = await del(`/api/v1/items/${itemB}`, adminAccess);
    expect(res.status === 200, `status ${res.status}`);
  });

  await test("Non-admin admin endpoint forbidden", async () => {
    const res = await patch(
      `/api/v1/admin/users/${userId}/role`,
      { role: "ADMIN" },
      userAccess
    );
    expect(res.status === 403, `status ${res.status}`);
  });

  await test("Admin role change", async () => {
    const res = await patch(
      `/api/v1/admin/users/${userId}/role`,
      { role: "ADMIN" },
      adminAccess
    );
    expect(res.status === 200, `status ${res.status}`);
    const res2 = await patch(
      `/api/v1/admin/users/${userId}/role`,
      { role: "USER" },
      adminAccess
    );
    expect(res2.status === 200, `status ${res2.status}`);
  });

  await test("Refresh rotates token", async () => {
    const res = await post("/api/v1/auth/refresh", {
      refreshToken: userRefresh,
    });
    const body = await res.json();
    expect(res.status === 200, `status ${res.status}`);
    const newRefresh = body.data.refreshToken;
    const resOld = await post("/api/v1/auth/refresh", {
      refreshToken: userRefresh,
    });
    expect(resOld.status === 401, `old status ${resOld.status}`);
    userRefresh = newRefresh;
    userAccess = body.data.accessToken;
  });

  await test("Logout revokes refresh", async () => {
    const res = await post(
      "/api/v1/auth/logout",
      { refreshToken: userRefresh },
      userAccess
    );
    expect(res.status === 200, `status ${res.status}`);
    const res2 = await post("/api/v1/auth/refresh", {
      refreshToken: userRefresh,
    });
    expect(res2.status === 401, `status ${res2.status}`);
  });

  await test("Error format", async () => {
    const res = await fetch(`${base}/api/v1/does-not-exist`);
    const body = await res.json();
    expect(res.status === 404 || res.status === 400, `status ${res.status}`);
    expect(
      body.error && body.error.code && body.error.requestId,
      "bad error format"
    );
  });

  await test("CORS default deny", async () => {
    const res = await fetch(`${base}/health`, {
      headers: { Origin: "http://evil.com" },
    });
    expect(
      !res.headers.get("access-control-allow-origin"),
      "CORS header present"
    );
  });

  server.close();
  printResults();
  await writeJsonSummary();
}

async function post(path: string, body: any, token?: string) {
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function patch(path: string, body: any, token?: string) {
  return fetch(`${base}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function del(path: string, token?: string) {
  return fetch(`${base}${path}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, pass: true });
  } catch (err: any) {
    results.push({ name, pass: false, details: err?.message || String(err) });
  }
}

function expect(condition: any, message: string) {
  if (!condition) throw new Error(message);
}

function printResults() {
  const lines = results.map(
    (r) =>
      `${r.pass ? "PASS" : "FAIL"} - ${r.name}${
        r.details ? ` :: ${r.details}` : ""
      }`
  );
  console.log(lines.join("\n"));
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.log(`\nFailures: ${failed.length}`);
  }
}

async function writeJsonSummary() {
  const summary = {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
    results,
  };
  await fs.promises.writeFile(
    "tests/test-results.json",
    JSON.stringify(summary, null, 2)
  );
  console.log("\nJSON summary written to tests/test-results.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
