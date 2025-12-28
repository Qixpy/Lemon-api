import { Prisma } from "@prisma/client";

export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function isPrismaKnownError(
  err: unknown
): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError;
}

export function mapPrismaError(
  err: Prisma.PrismaClientKnownRequestError
): AppError {
  if (err.code === "P2002") {
    return new AppError(409, "conflict", "Resource already exists");
  }
  return new AppError(400, "bad_request", "Database constraint error");
}
