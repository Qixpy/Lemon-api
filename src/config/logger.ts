import pino from "pino";
import pinoHttp from "pino-http";
import { config } from "./env";

export const logger = pino({
  level: config.isProd ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "query",
      "params",
    ],
    remove: true,
  },
});

export const httpLogger = pinoHttp({
  logger,
  autoLogging: config.env !== "test",
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie"],
    remove: true,
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customProps: (req) => ({ requestId: req.requestId }),
});
