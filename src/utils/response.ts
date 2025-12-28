import { Response } from "express";

export function success(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ data });
}

export function error(
  res: Response,
  code: string,
  message: string,
  requestId?: string,
  status = 400
) {
  return res.status(status).json({ error: { code, message, requestId } });
}
