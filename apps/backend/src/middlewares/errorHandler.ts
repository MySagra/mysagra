import { logger } from "@/config/logger";
import { ErrorRequestHandler } from "express";
import { Prisma } from "@/generated/prisma_client";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case "P2002": {
                const target = (err.meta?.target as string[]) || ["field"];
                res.status(409).json({
                    message: `Conflict: The value for ${target} already exists.`,
                    error: "UniqueConstraintViolation",
                })
                return;
            }
            case "P2025": {
                res.status(404).json({
                    message: "Resource not found.",
                    error: "RecordNotFound",
                });
                return;
            }
            case "P2003": {
                const fieldName = err.meta?.field_name || "relation";
                res.status(400).json({
                    message: `Invalid reference: The related ${fieldName} does not exist.`,
                    error: "ForeignKeyConstraintViolation",
                });
                return;
            }
            case "P2000": {
                res.status(400).json({
                    message: "Input value is too long for the database column.",
                    error: "InputTooLong",
                });
                return;
            }

            default:
                // Fallback for other Prisma errors (e.g. connection issues)
                res.status(500).json({
                    message: "Database error occurred.",
                });
                return;
        }
    }

    // handle generic error and logging
    logger.error({
        message: err.message,
        stack: err.stack,
        context: "ErrorHandler",
    });
    res.status(500).json({ message: "Internal error, retry later" });
}