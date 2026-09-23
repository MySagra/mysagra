import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import swaggerUi from 'swagger-ui-express'
import { Application, Request, Response } from "express";
import { env } from "@/config/env";

import { SESSION_COOKIE } from "@/common/constants";
import { APP_VERSION } from "@/config/version";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'cookieAuth', {
    type: 'apiKey',
    in: 'cookie',
    name: SESSION_COOKIE,
    description: 'HTTP-only session cookie, set automatically on login',
})

registry.registerComponent('securitySchemes', 'apiKeyAuth', {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-KEY',
    description: 'API key sent via the X-API-KEY header',
})

export function generateOpenApiDocument() {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            version: APP_VERSION,
            title: 'MySagra API',
            description: 'API documentation dynamically generated with Zod and OpenAPI'
        },
        tags: [
            { name: 'Auth' },
            { name: 'API Keys' },
            { name: 'Users' },
            { name: 'Roles' },
            { name: 'Stations' },
            { name: 'Categories' },
            { name: 'Foods' },
            { name: 'Ingredients' },
            { name: 'Orders' },
            { name: 'Printers' },
            { name: 'CashRegisters' },
            { name: 'Reports' },
            { name: 'Banners' },
            { name: 'Order Instructions' },
            { name: 'Events (SSE)' }
        ],
    })
}

export function setupSwagger(app: Application) {
    const openApiDocument = generateOpenApiDocument();

    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument))

    if (env.NODE_ENV !== 'production') {
        app.get('/api-docs.json', (_req: Request, res: Response) => {
            res.setHeader('Content-Type', 'Application/json');
            res.json(openApiDocument);
        })
    }
}