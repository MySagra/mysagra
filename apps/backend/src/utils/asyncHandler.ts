import { Response, NextFunction, RequestHandler } from "express";
import { RequestValidationSchema, TypedRequest } from "@/types/request";

type TypedController<T extends RequestValidationSchema> = (
    req: TypedRequest<T>,
    res: Response,
    next: NextFunction
) => Promise<any> | any;

export const asyncHandler = <T extends RequestValidationSchema>(fn: TypedController<T>): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(fn(req as TypedRequest<T>, res, next)).catch(next);
    };
};