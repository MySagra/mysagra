import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from '@repo/contract';

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'MySagra API',
      version: '1.0.0',
      description: 'API Documentation for MySagra Management System',
    },
    servers: [
      {
        url: '/v1',
        description: 'Production API',
      },
    ]
  });
}