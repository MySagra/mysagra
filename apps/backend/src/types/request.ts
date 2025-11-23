import { Request } from "express";

export interface RequestValidationSchema {
    query?: any,
    body?: any,
    params?: any
}

export interface TypedRequest<T extends RequestValidationSchema> extends Request {
    validated: {
        query: T['query'];
        body: T['body'];
        params: T['params']
    }
}