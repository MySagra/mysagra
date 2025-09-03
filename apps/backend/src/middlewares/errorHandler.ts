import { logger } from "@/config/logger";
import { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    logger.error({
        message: err.message,
        stack: err.stack,
        context: "ErrorHandler",
    });
    res.status(500).json({ message: "Internal error, retry later" });
}