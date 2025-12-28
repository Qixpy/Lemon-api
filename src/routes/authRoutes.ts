import { Router, RequestHandler } from "express";
import {
  login,
  refresh,
  register,
  logoutHandler,
} from "../controllers/authController";
import { validateBody } from "../middleware/validate";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from "../schemas/authSchemas";

export function createAuthRouter(authLimiter: RequestHandler) {
  const router = Router();

  router.post("/register", validateBody(registerSchema), register);
  router.post("/login", authLimiter, validateBody(loginSchema), login);
  router.post("/refresh", authLimiter, validateBody(refreshSchema), refresh);
  router.post("/logout", authLimiter, validateBody(logoutSchema), logoutHandler);

  return router;
}
