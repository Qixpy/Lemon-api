import { Request, Response, NextFunction } from "express";
import {
  loginUser,
  refreshTokens,
  registerUser,
  logout,
} from "../services/authService";
import { success } from "../utils/response";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const { user, accessToken, refreshToken } = await registerUser(
      email,
      password
    );
    return success(
      res,
      {
        user: { id: user.id, email: user.email, role: user.role },
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const { user, accessToken, refreshToken } = await loginUser(
      email,
      password,
      {
        ip: req.ip,
        userAgent: req.get("user-agent") || undefined,
      }
    );
    return success(res, {
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    const {
      user,
      accessToken,
      refreshToken: newRefresh,
    } = await refreshTokens(refreshToken, {
      ip: req.ip,
      userAgent: req.get("user-agent") || undefined,
    });
    return success(res, {
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken: newRefresh,
    });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    await logout(refreshToken, {
      actorUserId: req.auth?.userId,
      ip: req.ip,
      userAgent: req.get("user-agent") || undefined,
    });
    return success(res, { message: "Logged out" });
  } catch (err) {
    next(err);
  }
}
