import { Router, type RequestHandler } from "express";
import { registry } from "./openapi";
import { validateRequest } from "./validateRequest";
import { asyncHandler } from "@/utils/asyncHandler";
import type { RouteDefinition, ResponseSpec } from "./route";

const toExpressPath = (p: string) =>
    p === "" ? "/" : p.replace(/\{(\w+)\}/g, ":$1");

const toOpenApiResponses = (specs: Partial<Record<number, ResponseSpec>>) =>
    Object.fromEntries(
        Object.entries(specs).map(([status, spec]) => [
            status,
            spec!.schema
                ? {
                    description: spec!.description,
                    content: { "application/json": { schema: spec!.schema } }
                }
                : { description: spec!.description }
        ]),
    );

export interface ApiModule {
    basePath: string;
    router: Router;
    limiter?: RequestHandler;
}

export function createModule(cfg: {
    basePath: string;
    tags: string[];
    limiter?: RequestHandler;

    commonResponses?: Partial<Record<number, ResponseSpec>>;
    routes: RouteDefinition[];
}): ApiModule {
    const router = Router();

    for (const r of cfg.routes) {
        registry.registerPath({
            method: r.method,
            path: `${cfg.basePath}${r.path}`,
            summary: r.summary,
            description: r.description,
            tags: cfg.tags,
            security: r.security,
            request: {
                ...(r.params && { params: r.params }),
                ...(r.query && { query: r.query }),
                ...(r.body && { body: { content: { "application/json": { schema: r.body } } } }),
            },
            responses: toOpenApiResponses({ ...cfg.commonResponses, ...r.responses })
        });

        const chain: RequestHandler[] = [...(r.middlewares ?? [])]

        if (r.params || r.query || r.body) {
            chain.push(
                validateRequest({ params: r.params, query: r.query, body: r.body })
            );
        }

        chain.push(asyncHandler(r.handler as never));

        router[r.method](toExpressPath(r.path), ...chain);
    }

    return { basePath: cfg.basePath, router, limiter: cfg.limiter }
}

