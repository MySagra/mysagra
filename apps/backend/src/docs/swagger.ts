import swaggerJSDoc from "swagger-jsdoc";
import { SwaggerOptions } from "swagger-ui-express";
import path from "path";

const port = process.env.PORT || 3000;
const host = process.env.HOST || `localhost:${port}`;

const options: SwaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MySagra API Documentation',
            description: "Hello World!",
            version: '1.0.0',
        },
        tags: [
            {
                name: 'Auth',
                description: 'Authentication and authorization'
            },
            {
                name: 'Users',
                description: 'User management'
            },
            {
                name: 'Roles',
                description: 'Role management'
            },
            {
                name: 'Categories',
                description: 'Category management'
            },
            {
                name: 'Foods',
                description: 'Food management'
            },
            {
                name: 'Orders',
                description: 'Order management'
            },
            {
                name: 'Stats',
                description: 'Order stats'
            }
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    // Percorsi per leggere documentazione da file TypeScript e JavaScript
    apis: [
        path.join(__dirname, '../routes/**/*.{ts,js}'), // Legge sia .ts che .js
        path.join(__dirname, '../controllers/**/*.{ts,js}'), // Se hai documentazione nei controller
    ]
}

export const swaggerSpec = swaggerJSDoc(options);