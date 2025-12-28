import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";
import { recordAuditEvent } from "./auditService";

export async function createItem(
  ownerId: string,
  data: { title: string; description?: string },
  context?: { ip?: string; userAgent?: string }
) {
  const item = await prisma.item.create({
    data: { ownerId, title: data.title, description: data.description || "" },
  });
  await recordAuditEvent({
    action: "ITEM_CREATE",
    actorUserId: ownerId,
    ip: context?.ip,
    userAgent: context?.userAgent,
    metadata: { itemId: item.id },
  });
  return item;
}

export async function listItems(
  params: {
    userId: string;
    isAdmin: boolean;
    includeAll?: boolean;
  },
  context?: { ip?: string; userAgent?: string }
) {
  const { userId, isAdmin, includeAll } = params;
  if (includeAll && !isAdmin) {
    await recordAuditEvent({
      action: "ITEM_ACCESS_DENIED",
      actorUserId: userId,
      ip: context?.ip,
      userAgent: context?.userAgent,
      metadata: { reason: "includeAll_forbidden" },
    });
    throw new AppError(403, "forbidden", "Admin role required for includeAll");
  }
  const where = isAdmin && includeAll ? {} : { ownerId: userId };
  const items = await prisma.item.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  await recordAuditEvent({
    action: "ITEM_READ",
    actorUserId: userId,
    ip: context?.ip,
    userAgent: context?.userAgent,
    metadata: { includeAll, count: items.length },
  });
  return items;
}

export async function getItemById(
  id: string,
  userId: string,
  isAdmin: boolean,
  context?: { ip?: string; userAgent?: string }
) {
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) throw new AppError(404, "not_found", "Item not found");
  if (!isAdmin && item.ownerId !== userId) {
    await recordAuditEvent({
      action: "ITEM_ACCESS_DENIED",
      actorUserId: userId,
      ip: context?.ip,
      userAgent: context?.userAgent,
      metadata: { itemId: id, ownerId: item.ownerId },
    });
    throw new AppError(404, "not_found", "Item not found");
  }
  await recordAuditEvent({
    action: "ITEM_READ",
    actorUserId: userId,
    ip: context?.ip,
    userAgent: context?.userAgent,
    metadata: { itemId: id },
  });
  return item;
}

export async function updateItem(
  id: string,
  userId: string,
  isAdmin: boolean,
  data: { title?: string; description?: string },
  context?: { ip?: string; userAgent?: string }
) {
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "not_found", "Item not found");
  if (!isAdmin && existing.ownerId !== userId) {
    await recordAuditEvent({
      action: "ITEM_ACCESS_DENIED",
      actorUserId: userId,
      ip: context?.ip,
      userAgent: context?.userAgent,
      metadata: { itemId: id, action: "update" },
    });
    throw new AppError(404, "not_found", "Item not found");
  }
  const updated = await prisma.item.update({ where: { id }, data });
  await recordAuditEvent({
    action: "ITEM_UPDATE",
    actorUserId: userId,
    ip: context?.ip,
    userAgent: context?.userAgent,
    metadata: { itemId: id, changes: Object.keys(data) },
  });
  return updated;
}

export async function deleteItem(
  id: string,
  userId: string,
  isAdmin: boolean,
  context?: { ip?: string; userAgent?: string }
) {
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "not_found", "Item not found");
  if (!isAdmin && existing.ownerId !== userId) {
    await recordAuditEvent({
      action: "ITEM_ACCESS_DENIED",
      actorUserId: userId,
      ip: context?.ip,
      userAgent: context?.userAgent,
      metadata: { itemId: id, action: "delete" },
    });
    throw new AppError(404, "not_found", "Item not found");
  }
  await prisma.item.delete({ where: { id } });
  await recordAuditEvent({
    action: "ITEM_DELETE",
    actorUserId: userId,
    ip: context?.ip,
    userAgent: context?.userAgent,
    metadata: { itemId: id },
  });
}
