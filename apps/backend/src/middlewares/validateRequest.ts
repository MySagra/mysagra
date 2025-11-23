import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";
import { logger } from "@/config/logger";


export const validateRequest = (schemas: {
    params?: ZodTypeAny,
    query?: ZodTypeAny,
    body?: ZodTypeAny
}) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.validated) req.validated = {};

        if (schemas.params) {
            req.validated.params = await schemas.params.parse(req.params);
        }

        if (schemas.query) {
            req.validated.query = await schemas.query.parse(req.query);
        }

        if (schemas.body) {
            req.validated.body = await schemas.body.parse(req.body);
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