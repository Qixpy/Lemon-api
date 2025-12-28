import { Router } from "express";
import {
  createItemHandler,
  deleteItemHandler,
  getItemHandler,
  listItemsHandler,
  updateItemHandler,
} from "../controllers/itemController";
import { requireAuth } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createItemSchema,
  listItemsQuerySchema,
  updateItemSchema,
} from "../schemas/itemSchemas";

const router = Router();

router.use(requireAuth);

router.post("/", validateBody(createItemSchema), createItemHandler);
router.get("/", validateQuery(listItemsQuerySchema), listItemsHandler);
router.get("/:id", getItemHandler);
router.patch("/:id", validateBody(updateItemSchema), updateItemHandler);
router.delete("/:id", deleteItemHandler);

export default router;
