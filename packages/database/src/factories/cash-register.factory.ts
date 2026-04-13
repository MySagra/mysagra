import { faker } from "@faker-js/faker";
import type { PrismaClient } from "../generated/prisma_client/client";

export interface CreateCashRegisterInput {
  name?: string;
  enabled?: boolean;
  defaultPrinterId?: string | null;
}

export async function createCashRegister(
  prisma: PrismaClient,
  overrides: CreateCashRegisterInput = {}
) {
  return prisma.cashRegister.create({
    data: {
      name:
        overrides.name ??
        `Cassa ${faker.commerce.department()} ${faker.string.alphanumeric(3)}`,
      enabled: overrides.enabled ?? true,
      defaultPrinterId: overrides.defaultPrinterId ?? null,
    },
  });
}
