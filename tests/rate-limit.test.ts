import { describe, it, expect } from "vitest";
import request from "supertest";
import { getTestApp } from "./helpers";

describe("Rate Limiting", () => {
  it("auth rate limit returns 429 after max attempts", async () => {
    const app = getTestApp({
      rateLimitConfig: {
        general: { windowMs: 10000, max: 100 },
        auth: { windowMs: 10000, max: 3 },
      },
    });

    // Make requests up to the limit
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "user@example.com", password: "wrong" });
    }

    // Next request should be rate limited
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "user@example.com", password: "wrong" })
      .expect(429);

    expect(res.body.error.code).toBe("too_many_requests");
    expect(res.body.error).toHaveProperty("requestId");
  });
});
