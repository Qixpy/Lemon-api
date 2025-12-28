import rateLimit from "express-rate-limit";
import { config } from "./env";

export function createLimiters(
  generalConfig?: { windowMs: number; max: number },
  authConfig?: { windowMs: number; max: number }
) {
  const genConfig = generalConfig || config.rateLimit;
  const authCfg = authConfig || config.authRateLimit;

  return {
    general: rateLimit({
      windowMs: genConfig.windowMs,
      max: genConfig.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: "Too many requests",
      handler: (req, res, _next, options) => {
        res.status(options.statusCode).json({
          error: {
            code: "too_many_requests",
            message:
              typeof options.message === "string"
                ? options.message
                : "Too many requests",
            requestId: req.requestId,
          },
        });
      },
    }),
    auth: rateLimit({
      windowMs: authCfg.windowMs,
      max: authCfg.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: "Too many auth attempts",
      handler: (req, res, _next, options) => {
        res.status(options.statusCode).json({
          error: {
            code: "too_many_requests",
            message:
              typeof options.message === "string"
                ? options.message
                : "Too many auth attempts",
            requestId: req.requestId,
          },
        });
      },
    }),
  };
}

export const generalLimiter = createLimiters().general;
export const authLimiter = createLimiters().auth;
