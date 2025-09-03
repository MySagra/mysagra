import { Request, Response, NextFunction } from "express";
import { AnySchema } from "joi";
import { logger } from "@/config/logger";

export const validateRequest = (schema: AnySchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const schemaKeys = (schema as any).$_terms.keys.map((k: any) => k.key);
        
        const dataToValidate: any = {};
        (['body', 'params', 'query'] as const).forEach((key) => {
            if (schemaKeys.includes(key)) {
                dataToValidate[key] = req[key];
            }
        });

        const { error, value } = schema.validate(dataToValidate, { convert: true, abortEarly: false });

        if (error) {
            res.status(400).json({ message: error.details.map(d => d.message).join('; ') });
            logger.error({
                message: "Validation error",
                details: error.details
            });
            return; 
        }

        //converted fields
        for (const key of Object.keys(value)) {
            (req as any)[key] = value[key];
        }

        next();
    };
};