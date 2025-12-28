import { PrismaClient } from "@prisma/client";
import { config } from "../config/env";
import { logger } from "../config/logger";

export const prisma = new PrismaClient({
  log:
    config.env === "development"
      ? [
          { emit: "event", level: "error" },
          { emit: "stdout", level: "warn" },
          { emit: "stdout", level: "query" },
        ]
      : [{ emit: "event", level: "error" }],
});

prisma.$on("error", (e) => {
  logger.error({ err: e }, "Prisma error");
});
