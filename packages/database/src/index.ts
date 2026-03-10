// packages/database/src/index.ts
export * from './generated/prisma_client/client';
export { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from './generated/prisma_client/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
export const prisma = new PrismaClient({ adapter });
