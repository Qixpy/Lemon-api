import express from "express";
import helmet from "helmet";
import cors from "cors";
import { httpLogger } from "./config/logger";
import { config } from "./config/env";
import { createLimiters } from "./config/rateLimit";
import routes from "./routes";
import { requestId } from "./middleware/requestId";
import { errorHandler } from "./middleware/errorHandler";
import { prisma } from "./db/prisma";

export type AppOptions = {
  enableHttpLogger?: boolean;
  rateLimitConfig?: {
    general?: { windowMs: number; max: number };
    auth?: { windowMs: number; max: number };
  };
};

export function createApp(options: AppOptions = {}) {
  const app = express();
  const { enableHttpLogger = config.env !== "test" } = options;

  app.set("trust proxy", 1);

  app.disable("x-powered-by");
  app.use(requestId);
  if (enableHttpLogger) {
    app.use(httpLogger);
  }
  app.use(helmet());
  app.use(express.json({ limit: "10kb" }));

  if (config.corsOrigins.length > 0) {
    app.use((req, res, next) => {
      const origin = req.get("origin");
      if (origin && !config.corsOrigins.includes(origin)) {
        return res.status(403).json({
          error: {
            code: "cors_forbidden",
            message: "Origin not allowed",
            requestId: req.requestId,
          },
        });
      }
      next();
    });
    app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || config.corsOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
      })
    );
  }

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/ready", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ready" });
    } catch (err) {
      res.status(503).json({ status: "not_ready" });
    }
  });

  const limiters = createLimiters(
    options.rateLimitConfig?.general,
    options.rateLimitConfig?.auth
  );
  app.use("/api/v1", limiters.general);
  app.use("/api/v1", routes(limiters.auth));

  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: "not_found",
        message: "Not found",
        requestId: req.requestId,
      },
    });
  });

  app.use(errorHandler);

  return app;
}
