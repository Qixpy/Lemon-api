import { Router } from "express";
import { updateRoleHandler } from "../controllers/adminController";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { updateUserRoleSchema } from "../schemas/adminSchemas";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.patch(
  "/users/:id/role",
  validateBody(updateUserRoleSchema),
  updateRoleHandler
);

export default router;
