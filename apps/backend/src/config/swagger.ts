import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import swaggerUi from 'swagger-ui-express'
import { Application, Request, Response } from "express";
import { env } from "./env";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'cookieAuth', {
    type: 'apiKey',
    scheme: 'cookie',
    name: 'mysagra_token'
})

export function generateOpenApiDocument() {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            version: '1.4.2',
            title: 'MySagra API',
            description: 'API documentation dynamically generated with Zod and OpenAPI'
        },
        tags: [
            { name: 'Auth' },
            { name: 'Users' },
            { name: 'Roles' },
            { name: 'Categories' },
            { name: 'Foods' },
            { name: 'Ingredients' },
            { name: 'Orders' },
            { name: 'Printers' },
            { name: 'CashRegisters' },
            { name: 'Events (SSE)' },
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