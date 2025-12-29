import { describe, it, expect } from "vitest";
import request from "supertest";
import { getTestApp } from "./helpers";

describe("Security Headers", () => {
  it("includes helmet security headers", async () => {
    const app = getTestApp();
    const res = await request(app).get("/health");

    // Check for key helmet headers
    expect(res.headers["x-dns-prefetch-control"]).toBeDefined();
    expect(res.headers["x-frame-options"]).toBeDefined();
    expect(res.headers["x-content-type-options"]).toBeDefined();
    expect(res.headers["cross-origin-resource-policy"]).toBeDefined();
  });

  it("removes x-powered-by header", async () => {
    const app = getTestApp();
    const res = await request(app).get("/health");

    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("CORS: without allowlist, no Access-Control-Allow-Origin", async () => {
    const app = getTestApp();
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://evil.com");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  // Note: Testing CORS with allowlist would require configuring
  // CORS_ORIGINS env var and recreating the app. Skip for simplicity
  // or implement with dedicated test app instance if needed.
});
