import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { logger } from "@/config/logger";

export const validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { success, error, data } = schema.safeParse(req.params);

        if (success) {
            req.params = data
            return next();
        }

        logger.error(JSON.stringify({ type: "Params", errors: error.errors }))
        res.status(400).json({ errors: error.errors })
    };
};

export const validateBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { success, error, data } = schema.safeParse(req.body);

        if (success) {
            req.body = data
            return next();
        }

        logger.error(JSON.stringify({ type: "Body", errors: error.errors }))
        res.status(400).json({ errors: error.errors })
    };
};