import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { logger } from "@/config/logger";

export const validateRequest = (schema: AnyZodObject) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    errors: error.errors,
                });
            }
            logger.error(JSON.stringify({ type: "validation_error", errors: error }))
            return res.status(500).json({ error: 'Server Error' })
            next(error);
        }
    };