import { faker } from "@faker-js/faker";
import type { PrismaClient } from "../generated/prisma_client/client";

export interface CreateCategoryInput {
  name?: string;
  available?: boolean;
  position?: number;
  printerId?: string | null;
}

const SAGRA_CATEGORIES = [
  "Pizzeria",
  "Grigliata",
  "Friggitoria",
  "Pasta",
  "Dolci",
  "Bevande",
  "Panini",
  "Antipasti",
  "Contorni",
  "Gelati",
];

export async function createCategory(
  prisma: PrismaClient,
  overrides: CreateCategoryInput = {}
) {
  return prisma.category.create({
    data: {
      name:
        overrides.name ??
        `${faker.helpers.arrayElement(SAGRA_CATEGORIES)} ${faker.string.alphanumeric(4)}`,
      available: overrides.available ?? true,
      position: overrides.position ?? faker.number.int({ min: 0, max: 20 }),
      printerId: overrides.printerId ?? null,
    },
  });
}
