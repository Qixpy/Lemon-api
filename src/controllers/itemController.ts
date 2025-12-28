import { Request, Response, NextFunction } from "express";
import {
  createItem,
  deleteItem,
  getItemById,
  listItems,
  updateItem,
} from "../services/itemService";
import { success } from "../utils/response";

export async function createItemHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { title, description } = req.body as {
      title: string;
      description?: string;
    };
    const item = await createItem(
      req.auth!.userId,
      { title, description },
      { ip: req.ip, userAgent: req.get("user-agent") || undefined }
    );
    return success(res, { item }, 201);
  } catch (err) {
    next(err);
  }
}

export async function listItemsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const includeAll =
      (req.query as { includeAll?: string }).includeAll === "true";
    const items = await listItems(
      {
        userId: req.auth!.userId,
        isAdmin: req.auth!.role === "ADMIN",
        includeAll,
      },
      { ip: req.ip, userAgent: req.get("user-agent") || undefined }
    );
    return success(res, { items });
  } catch (err) {
    next(err);
  }
}

export async function getItemHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const item = await getItemById(
      id,
      req.auth!.userId,
      req.auth!.role === "ADMIN",
      { ip: req.ip, userAgent: req.get("user-agent") || undefined }
    );
    return success(res, { item });
  } catch (err) {
    next(err);
  }
}

export async function updateItemHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { title, description } = req.body as {
      title?: string;
      description?: string;
    };
    const item = await updateItem(
      id,
      req.auth!.userId,
      req.auth!.role === "ADMIN",
      { title, description },
      { ip: req.ip, userAgent: req.get("user-agent") || undefined }
    );
    return success(res, { item });
  } catch (err) {
    next(err);
  }
}

export async function deleteItemHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    await deleteItem(
      id,
      req.auth!.userId,
      req.auth!.role === "ADMIN",
      { ip: req.ip, userAgent: req.get("user-agent") || undefined }
    );
    return success(res, { message: "Deleted" });
  } catch (err) {
    next(err);
  }
}
