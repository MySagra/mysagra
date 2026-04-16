import { faker } from "@faker-js/faker";
import type { PrismaClient } from "../generated/prisma_client/client";

export interface CreateFoodInput {
  name?: string;
  description?: string;
  price?: number;
  available?: boolean;
  categoryId: string;
  printerId?: string | null;
  ingredientIds?: string[];
}

const FOOD_NAMES = [
  "Margherita",
  "Diavola",
  "Quattro Formaggi",
  "Capricciosa",
  "Marinara",
  "Prosciutto e Funghi",
  "Napoli",
  "Calzone",
  "Focaccia",
  "Bruschetta",
  "Arrosticini",
  "Salamella",
  "Costine alla griglia",
  "Patatine fritte",
  "Olive ascolane",
  "Supplì",
  "Arancini",
  "Pasta al ragù",
  "Lasagna",
  "Gnocchi al pomodoro",
  "Tiramisù",
  "Panna cotta",
  "Birra media",
  "Coca Cola",
  "Acqua naturale",
  "Panino con porchetta",
  "Panino con salsiccia",
  "Frittura mista",
  "Polenta e spezzatino",
  "Tagliatelle ai funghi",
];

export async function createFood(
  prisma: PrismaClient,
  input: CreateFoodInput
) {
  return prisma.food.create({
    data: {
      name:
        input.name ??
        `${faker.helpers.arrayElement(FOOD_NAMES)} ${faker.string.alphanumeric(4)}`,
      description:
        input.description ??
        faker.helpers.maybe(() => faker.food.description(), {
          probability: 0.7,
        }) ??
        undefined,
      price: input.price ?? parseFloat(faker.commerce.price({ min: 2, max: 25, dec: 2 })),
      available: input.available ?? true,
      categoryId: input.categoryId,
      printerId: input.printerId ?? null,
      foodIngredients: input.ingredientIds?.length
        ? {
            create: input.ingredientIds.map((ingredientId) => ({
              ingredientId,
            })),
          }
        : undefined,
    },
  });
}
