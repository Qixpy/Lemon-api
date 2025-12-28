import { Request, Response, NextFunction } from "express";
import { updateUserRole } from "../services/adminService";
import { success } from "../utils/response";

export async function updateRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { role } = req.body as { role: "USER" | "ADMIN" };
    const updated = await updateUserRole({
      actorUserId: req.auth!.userId,
      targetUserId: id,
      role,
      ip: req.ip,
      userAgent: req.get("user-agent") || undefined,
    });
    return success(res, {
      user: { id: updated.id, email: updated.email, role: updated.role },
    });
  } catch (err) {
    next(err);
  }
}
