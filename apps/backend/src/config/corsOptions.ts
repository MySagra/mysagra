import { env } from "./env";

export const corsOptions = {
  origin: env.ALLOWED_ORIGINS || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};