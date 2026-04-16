import { faker } from "@faker-js/faker";
import type { PrismaClient } from "../generated/prisma_client/client";

export interface CreateIngredientInput {
  name?: string;
}

const INGREDIENTS = [
  "Mozzarella",
  "Pomodoro",
  "Basilico",
  "Prosciutto",
  "Funghi",
  "Salsiccia",
  "Peperoni",
  "Olive",
  "Cipolla",
  "Aglio",
  "Parmigiano",
  "Gorgonzola",
  "Ricotta",
  "Rucola",
  "Melanzane",
  "Zucchine",
  "Peperoncino",
  "Tonno",
  "Acciughe",
  "Patate",
  "Wurstel",
  "Speck",
  "Bresaola",
  "Burrata",
  "Nduja",
];

export async function createIngredient(
  prisma: PrismaClient,
  overrides: CreateIngredientInput = {}
) {
  return prisma.ingredient.create({
    data: {
      name:
        overrides.name ??
        `${faker.helpers.arrayElement(INGREDIENTS)} ${faker.string.alphanumeric(3)}`,
    },
  });
}
