import { describe, it, expect } from "vitest";
import request from "supertest";
import { getTestApp } from "./helpers";

describe("Health and Readiness", () => {
  it("GET /health returns 200 with status ok and request ID", async () => {
    const app = getTestApp();
    const res = await request(app).get("/health").expect(200);

    expect(res.body).toEqual({ status: "ok" });
    expect(res.headers["x-request-id"]).toBeDefined();
  });

  it("GET /ready returns 200 when DB is reachable", async () => {
    const app = getTestApp();
    const res = await request(app).get("/ready").expect(200);

    expect(res.body).toEqual({ status: "ready" });
  });

  // Note: Testing 503 when DB is unreachable would require mocking or
  // temporarily breaking the DB connection, which is fragile in CI.
  // Skip for now or implement with proper mocking if needed.
});
