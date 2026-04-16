import { faker } from "@faker-js/faker";
import type { PrismaClient } from "../generated/prisma_client/client";

export interface CreateOrderInstructionInput {
  text?: string;
  position?: number;
}

const INSTRUCTIONS = [
  "**Comunica il codice ordine** alla cassa",
  "**Paga l'ordine** e ritira lo scontrino",
  "**Attendi il tuo numero** sul display",
  "**Ritira il tuo ordine** al bancone indicato",
  "Per allergie o intolleranze, **comunica al cassiere**",
];

export async function createOrderInstruction(
  prisma: PrismaClient,
  overrides: CreateOrderInstructionInput = {}
) {
  return prisma.orderInstruction.create({
    data: {
      text:
        overrides.text ?? faker.helpers.arrayElement(INSTRUCTIONS),
      position: overrides.position ?? faker.number.int({ min: 0, max: 10 }),
    },
  });
}
