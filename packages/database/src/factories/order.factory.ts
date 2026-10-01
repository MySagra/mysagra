import { faker } from "@faker-js/faker";
import type { PrismaClient } from "../generated/prisma_client/client";
import type { OrderStatus, PaymentMethod } from "../generated/prisma_client/enums";

export interface CreateOrderInput {
  displayCode?: string;
  table?: string | null;
  customer?: string | null;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod | null;
  subTotal: number;
  discount?: number;
  surcharge?: number;
  total: number;
  userId?: string | null;
  cashRegisterId?: string | null;
  ticketNumber?: number | null;
  createdAt?: Date;
  confirmedAt?: Date | null;
  completedAt?: Date | null;
  baseDate?: Date; // Base date for generating orders of the same day
}

let displayCodeCounter = 0;

function indexToLetters(idx: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  idx = idx + 1; // 1-indexed
  while (idx > 0) {
    idx--;
    result = letters[idx % 26] + result;
    idx = Math.floor(idx / 26);
  }
  return result;
}

function generateDisplayCode(): string {
  displayCodeCounter++;
  const letterGroupIdx = Math.floor((displayCodeCounter - 1) / 999);
  const letterPart = indexToLetters(letterGroupIdx);
  const numberPart = ((displayCodeCounter - 1) % 999) + 1;
  return `${letterPart}${numberPart}`;
}

export function resetDisplayCodeCounter() {
  displayCodeCounter = 0;
}

/**
 * Initialize display code counter from the total count of orders in database
 * This ensures unique display codes across multiple seed runs
 */
export async function initializeDisplayCodeCounterFromDb(prisma: PrismaClient) {
  const totalOrders = await prisma.order.count();
  displayCodeCounter = totalOrders;
}

/**
 * Helper function to create orders for a specific day (baseDate).
 * All generated orders will have createdAt and confirmedAt on the same day.
 *
 * @param prisma - PrismaClient instance
 * @param baseDate - The date for which to create orders
 * @param inputs - Array of order inputs (baseDate will be automatically set)
 */
export async function createOrdersForDay(
  prisma: PrismaClient,
  baseDate: Date,
  inputs: CreateOrderInput[]
) {
  return Promise.all(
    inputs.map((input) =>
      createOrder(prisma, { ...input, baseDate })
    )
  );
}

export async function createOrder(
  prisma: PrismaClient,
  input: CreateOrderInput
) {
  const status = input.status ?? "PENDING";
  const isConfirmed = status !== "PENDING";

  // Determine the base date for this order
  let now: Date;
  if (input.createdAt) {
    now = input.createdAt;
  } else {
    // Use baseDate if provided, otherwise use today
    const dateToUse = input.baseDate ?? new Date();
    const baseDate = new Date(dateToUse);
    baseDate.setHours(
      faker.number.int({ min: 6, max: 23 }),
      faker.number.int({ min: 0, max: 59 }),
      faker.number.int({ min: 0, max: 59 })
    );
    now = baseDate;
  }

  // confirmation data lives in confirmed_orders, only for non-pending orders
  const confirmedOrder = isConfirmed
    ? {
      ticketNumber: input.ticketNumber ?? faker.number.int({ min: 1, max: 999 }),
      paymentMethod: input.paymentMethod ?? faker.helpers.arrayElement(["CASH", "CARD"] as const),
      discount: input.discount ?? 0,
      total: input.total,
      userId: input.userId ?? null,
      cashRegisterId: input.cashRegisterId ?? null,
      confirmedAt:
        input.confirmedAt ??
        new Date(now.getTime() + faker.number.int({ min: 60000, max: 600000 })),
      completedAt:
        input.completedAt !== undefined
          ? input.completedAt
          : status === "COMPLETED" || status === "PICKED_UP"
            ? new Date(
              now.getTime() + faker.number.int({ min: 600000, max: 1800000 })
            )
            : null,
    }
    : undefined;

  return prisma.order.create({
    data: {
      displayCode: input.displayCode ?? generateDisplayCode(),
      table: input.table !== undefined ? input.table : `Tavolo ${faker.number.int({ min: 1, max: 50 })}`,
      customer: input.customer !== undefined ? input.customer : faker.person.fullName(),
      status,
      subTotal: input.subTotal,
      surcharge: input.surcharge ?? 0,
      createdAt: now,
      confirmedOrder: confirmedOrder ? { create: confirmedOrder } : undefined,
    },
    include: { confirmedOrder: true },
  });
}
