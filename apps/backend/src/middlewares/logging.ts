import { Request, Response, NextFunction } from "express";
import { logger, requestLogger } from "@/config/logger";

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const logData = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${Date.now() - startTime}ms`,
      userAgent: req.get("user-agent"),
      ip: req.ip,
      context: "HttpRequest",
      userId: req.user?.userId,
      query: Object.keys(req.query).length ? req.query : undefined,
      bodySize: req.body ? Object.keys(req.body).length : 0
    };

    // Log su entrambi: requestLogger per il file dedicato e logger principale per errori
    if (res.statusCode >= 400) {
      logger.error("Request failed", logData);
      requestLogger.error("Request failed", logData);
    } else {
      logger.info("Request completed", logData);
      requestLogger.info("Request completed", logData);
    }
  });

  next();
};