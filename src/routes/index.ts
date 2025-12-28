import { Router, RequestHandler } from "express";
import { createAuthRouter } from "./authRoutes";
import itemRoutes from "./itemRoutes";
import adminRoutes from "./adminRoutes";
import meRoutes from "./meRoutes";

export default function createRoutes(authLimiter: RequestHandler) {
  const router = Router();

  router.use("/auth", createAuthRouter(authLimiter));
  router.use("/items", itemRoutes);
  router.use("/admin", adminRoutes);
  router.use(meRoutes);

  return router;
}
