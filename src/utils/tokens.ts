import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "../config/env";

export type JwtPayload = {
  sub: string;
  role: "USER" | "ADMIN";
};

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: `${config.accessTokenTtlMinutes}m`,
    issuer: "lemon-api",
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtAccessSecret) as JwtPayload;
}

export function generateRefreshToken(): {
  token: string;
  hashed: string;
  expiresAt: Date;
} {
  const token = crypto.randomBytes(48).toString("base64url");
  const hashed = hashRefreshToken(token);
  const expiresAt = new Date(
    Date.now() + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000
  );
  return { token, hashed, expiresAt };
}

export function hashRefreshToken(token: string): string {
  return crypto
    .createHmac("sha256", config.refreshTokenSecret)
    .update(token)
    .digest("hex");
}
