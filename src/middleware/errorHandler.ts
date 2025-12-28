import { NextFunction, Request, Response } from "express";
import { AppError, isPrismaKnownError, mapPrismaError } from "../utils/errors";
import { logger } from "../config/logger";
import { config } from "../config/env";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  let responseError: AppError;

  if (err instanceof AppError) {
    responseError = err;
  } else if (isPrismaKnownError(err)) {
    responseError = mapPrismaError(err);
  } else {
    responseError = new AppError(500, "internal_error", "Unexpected error");
  }

  if (!(err instanceof AppError)) {
    logger.error({ err, requestId: req.requestId }, "Unhandled error");
  }

  if (config.isProd && responseError.status === 500) {
    responseError = new AppError(500, "internal_error", "Unexpected error");
  }

  res.status(responseError.status).json({
    error: {
      code: responseError.code,
      message: responseError.message,
      requestId: req.requestId,
    },
  });
}
