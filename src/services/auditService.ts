import { prisma } from "../db/prisma";

type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "TOKEN_REFRESH"
  | "TOKEN_REFRESH_FAILURE"
  | "TOKEN_REUSE_ATTEMPT"
  | "LOGOUT"
  | "LOGOUT_FAILURE"
  | "ROLE_CHANGE"
  | "ROLE_CHANGE_FAILURE"
  | "ADMIN_ACTION"
  | "ADMIN_ACTION_FAILURE"
  | "ITEM_CREATE"
  | "ITEM_READ"
  | "ITEM_UPDATE"
  | "ITEM_DELETE"
  | "ITEM_ACCESS_DENIED";

export async function recordAuditEvent(params: {
  action: AuditAction;
  actorUserId?: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { action, actorUserId, ip, userAgent, metadata } = params;
  await prisma.auditEvent.create({
    data: {
      action,
      actorUserId,
      ip: ip || null,
      userAgent: userAgent || null,
      metadata: metadata ? (sanitizeMetadata(metadata) as any) : undefined,
    },
  });
}

function sanitizeMetadata(obj: Record<string, unknown>) {
  const clone = { ...obj };
  if ("password" in clone) delete (clone as { password?: unknown }).password;
  if ("token" in clone) delete (clone as { token?: unknown }).token;
  if ("refreshToken" in clone)
    delete (clone as { refreshToken?: unknown }).refreshToken;
  return clone;
}
