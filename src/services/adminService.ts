import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";
import { recordAuditEvent } from "./auditService";

export async function updateUserRole(params: {
  actorUserId: string;
  targetUserId: string;
  role: "USER" | "ADMIN";
  ip?: string;
  userAgent?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.targetUserId },
  });
  if (!user) {
    await recordAuditEvent({
      action: "ROLE_CHANGE_FAILURE",
      actorUserId: params.actorUserId,
      ip: params.ip,
      userAgent: params.userAgent,
      metadata: { targetUserId: params.targetUserId, reason: "user_not_found" },
    });
    throw new AppError(404, "not_found", "User not found");
  }

  const updated = await prisma.user.update({
    where: { id: params.targetUserId },
    data: { role: params.role },
  });

  await recordAuditEvent({
    action: "ROLE_CHANGE",
    actorUserId: params.actorUserId,
    ip: params.ip,
    userAgent: params.userAgent,
    metadata: { targetUserId: params.targetUserId, newRole: params.role },
  });

  return updated;
}
