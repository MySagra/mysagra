import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import type { PrismaClient } from "../generated/prisma_client/client";
import type { KeyTypes } from "../generated/prisma_client/enums";

export interface CreateApiKeyInput {
  name?: string;
  type?: KeyTypes;
}

export async function createApiKey(
  prisma: PrismaClient,
  overrides: CreateApiKeyInput = {}
) {
  const type: KeyTypes =
    overrides.type ?? faker.helpers.arrayElement(["PRINTER", "WEBAPP"] as const);
  const prefix = type === "PRINTER" ? "ms_pt_" : "ms_wb_";
  const rawKey = faker.string.alphanumeric(32);
  const fullKey = `${prefix}${rawKey}`;
  const last_digits = rawKey.slice(-4);
  const hash_key = await bcrypt.hash(fullKey, 10);

  const apiKey = await prisma.apiKey.create({
    data: {
      hash_key,
      prefix,
      last_digits,
      type,
      name: overrides.name ?? faker.company.buzzPhrase(),
      createdAt: faker.date.recent({ days: 90 }),
      lastUsedAt: faker.helpers.maybe(() => faker.date.recent({ days: 7 }), {
        probability: 0.5,
      }),
      revokedAt: null,
    },
  });

  return { ...apiKey, plainKey: fullKey };
}
