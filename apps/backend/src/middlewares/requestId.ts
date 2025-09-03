import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export const requestId = (req: Request, res: Response, next: NextFunction) => {
    req.requestId = (req.headers["x-request-id"] as string) || uuidv4();
    res.setHeader("X-Request-ID", req.requestId);
    next();
};