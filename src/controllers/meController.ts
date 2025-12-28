import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";
import { success } from "../utils/response";

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    return success(res, { user });
  } catch (err) {
    next(err);
  }
}
