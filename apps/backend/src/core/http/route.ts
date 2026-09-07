import type { RequestHandler, Response } from "express";
import type { z, ZodObject, ZodPipe, ZodType } from "zod";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import type { TypedRequest } from "@/types/request";

type Method = "get" | "post" | "put" | "patch" | "delete";
type Schema = ZodType | undefined;
type ObjectSchema = ZodObject | ZodPipe | undefined;

type Validated<P extends ObjectSchema, Q extends ObjectSchema, B extends Schema> = {
    params: P extends ZodType ? z.infer<P> : undefined;
    query: Q extends ZodType ? z.infer<Q> : undefined;
    body: B extends ZodType ? z.infer<B> : undefined;
};

export interface ResponseSpec {
    description: string;
    schema?: ZodType;
};

export interface RouteDefinition<
    P extends ObjectSchema = ObjectSchema,
    Q extends ObjectSchema = ObjectSchema,
    B extends Schema = Schema
> {
    method: Method;
    path: string;
    summary: string;
    description?: string;
    security?: RouteConfig["security"];
    middlewares?: RequestHandler[];
    params?: P;
    query?: Q;
    body?: B;
    responses: Partial<Record<number, ResponseSpec>>;
    handler: (
        req: TypedRequest<Validated<P, Q, B>>,
        res: Response,
    ) => Promise<void> | void;
};

export const route = <
    P extends ObjectSchema = undefined,
    Q extends ObjectSchema = undefined,
    B extends Schema = undefined,
>(
    def: RouteDefinition<P, Q, B>,
): RouteDefinition<P, Q, B> => def;