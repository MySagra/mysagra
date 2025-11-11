import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";
import { logger } from "@/config/logger";


export const validateRequest = (schemas: {
    params?: ZodTypeAny,
    query?: ZodTypeAny,
    body?: ZodTypeAny
}) => (req: Request, res: Response, next: NextFunction) => {
    try {
        if (schemas.params) {
            req.params = schemas.params.parse(req.params);
        }

        if (schemas.query) {
            const parsedQuery = schemas.query.parse(req.query);
            Object.assign(req.query, parsedQuery);
        }

        if (schemas.body) {
            req.body = schemas.body.parse(req.body);
        }
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            logger.error(JSON.stringify({ type: "validation_error", errors: error.message }))
            return res.status(400).json({ errors: error.flatten().fieldErrors })
        }
        logger.error(JSON.stringify({ type: "validation_error", errors: error }))
        return res.status(500).json({ error: 'Server Error' })
    }
}