import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/tokens";
import { AppError } from "../utils/errors";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(
      new AppError(401, "unauthorized", "Missing authorization header")
    );
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    return next(new AppError(401, "unauthorized", "Invalid or expired token"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth || req.auth.role !== "ADMIN") {
    return next(new AppError(403, "forbidden", "Admin role required"));
  }
  return next();
}
