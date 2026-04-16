import { faker } from "@faker-js/faker";
import type { PrismaClient } from "../generated/prisma_client/client";

export interface CreateOrderItemInput {
  orderId: string;
  foodId: string;
  quantity?: number;
  unitPrice: number;
  unitSurcharge?: number;
  total?: number;
  notes?: string | null;
}

export async function createOrderItem(
  prisma: PrismaClient,
  input: CreateOrderItemInput
) {
  const quantity = input.quantity ?? faker.number.int({ min: 1, max: 5 });
  const unitSurcharge = input.unitSurcharge ?? 0;
  const total =
    input.total ?? (input.unitPrice + unitSurcharge) * quantity;

  return prisma.orderItem.create({
    data: {
      orderId: input.orderId,
      foodId: input.foodId,
      quantity,
      unitPrice: input.unitPrice,
      unitSurcharge,
      total,
      notes:
        input.notes !== undefined
          ? input.notes
          : faker.helpers.maybe(() => faker.lorem.sentence({ min: 2, max: 6 }), {
              probability: 0.2,
            }) ?? null,
    },
  });
}
