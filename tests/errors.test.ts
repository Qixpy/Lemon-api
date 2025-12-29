import { describe, it, expect } from "vitest";
import request from "supertest";
import { getTestApp } from "./helpers";

describe("Error Shape Consistency", () => {
  it("validation error returns consistent format with requestId", async () => {
    const app = getTestApp();
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "invalid", password: "weak" })
      .expect(400);

    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toHaveProperty("code");
    expect(res.body.error).toHaveProperty("message");
    expect(res.body.error).toHaveProperty("requestId");
    expect(res.headers["x-request-id"]).toBe(res.body.error.requestId);
  });

  it("404 error returns consistent format", async () => {
    const app = getTestApp();
    const res = await request(app).get("/api/v1/does-not-exist").expect(404);

    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe("not_found");
    expect(res.body.error).toHaveProperty("requestId");
  });

  it("unauthorized error returns consistent format", async () => {
    const app = getTestApp();
    const res = await request(app).get("/api/v1/me").expect(401);

    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toHaveProperty("code");
    expect(res.body.error).toHaveProperty("requestId");
  });
});
