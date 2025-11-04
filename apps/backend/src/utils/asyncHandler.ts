import { Request, Response, NextFunction, RequestHandler } from "express";

type Controller = (
    req: Request<any, any, any, any>,
    res: Response,
    next: NextFunction
) => Promise<any> | any;

export const asyncHandler = (fn: Controller): RequestHandler =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    }