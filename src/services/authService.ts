import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../utils/tokens";
import { hashPassword, verifyPassword } from "../utils/password";
import { recordAuditEvent } from "./auditService";

export async function registerUser(email: string, password: string) {
  const passwordHash = await hashPassword(password);
  try {
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });
    const { accessToken, refreshToken } = await issueTokens(user.id, user.role);
    return { user, accessToken, refreshToken };
  } catch (err: unknown) {
    throw err;
  }
}

export async function loginUser(
  email: string,
  password: string,
  context: { ip?: string; userAgent?: string }
) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await recordAuditEvent({
      action: "LOGIN_FAILURE",
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { email },
    });
    throw new AppError(401, "invalid_credentials", "Invalid email or password");
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    await recordAuditEvent({
      action: "LOGIN_FAILURE",
      actorUserId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
    });
    throw new AppError(401, "invalid_credentials", "Invalid email or password");
  }

  const tokens = await issueTokens(user.id, user.role);
  await recordAuditEvent({
    action: "LOGIN_SUCCESS",
    actorUserId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
  });
  return { user, ...tokens };
}

export async function refreshTokens(
  refreshToken: string,
  context: { ip?: string; userAgent?: string }
) {
  const hashed = hashRefreshToken(refreshToken);
  const record = await prisma.refreshToken.findFirst({
    where: { tokenHash: hashed },
  });

  // Detect reuse of revoked token
  if (record && record.revokedAt !== null) {
    await recordAuditEvent({
      action: "TOKEN_REUSE_ATTEMPT",
      actorUserId: record.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { refreshTokenId: record.id, revokedAt: record.revokedAt },
    });
    throw new AppError(401, "invalid_refresh", "Invalid refresh token");
  }

  if (!record || record.expiresAt < new Date()) {
    await recordAuditEvent({
      action: "TOKEN_REFRESH_FAILURE",
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: {
        reason: !record ? "not_found" : "expired",
      },
    });
    throw new AppError(401, "invalid_refresh", "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user) {
    throw new AppError(401, "invalid_refresh", "Invalid refresh token");
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokens(user.id, user.role);
  await recordAuditEvent({
    action: "TOKEN_REFRESH",
    actorUserId: user.id,
    ip: context.ip,
    userAgent: context.userAgent,
  });
  return { user, ...tokens };
}

export async function logout(
  refreshToken: string,
  context: { actorUserId?: string; ip?: string; userAgent?: string }
) {
  const hashed = hashRefreshToken(refreshToken);
  const record = await prisma.refreshToken.findFirst({
    where: { tokenHash: hashed, revokedAt: null },
  });
  if (record) {
    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    await recordAuditEvent({
      action: "LOGOUT",
      actorUserId: context.actorUserId,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { refreshTokenId: record.id },
    });
  } else {
    await recordAuditEvent({
      action: "LOGOUT_FAILURE",
      actorUserId: context.actorUserId,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { reason: "not_found" },
    });
  }
}

async function issueTokens(userId: string, role: "USER" | "ADMIN") {
  const accessToken = generateAccessToken({ sub: userId, role });
  const { token: refreshToken, hashed, expiresAt } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashed,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}
