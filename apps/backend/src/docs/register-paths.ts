import z from 'zod';
import { registry, LoginSchema } from '@repo/contract';

export function registerPaths() {
  // Registra la rotta di Login
  registry.registerPath({
    method: 'post',
    path: '/auth/login',
    summary: 'User Login',
    tags: ['Auth'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: LoginSchema, // Usa lo schema condiviso
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Login successful',
        content: {
          'application/json': {
            schema: z.object({ token: z.string() }), // Esempio inline, meglio usare schema condiviso anche qui
          },
        },
      },
    },
  });
  
  // ... qui registri le altre rotte
}