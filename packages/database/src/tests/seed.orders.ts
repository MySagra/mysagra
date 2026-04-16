/**
 * Seed Orders – Generates 500 orders using existing foods
 * Orders are distributed across a time window from 2 hours before to 2 hours after execution time.
 *
 * Run with: tsx src/tests/seed.orders.ts
 */
import "dotenv/config";

import { faker } from "@faker-js/faker";
import { PrismaClient } from "../generated/prisma_client/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import {
  createOrder,
  createOrderItem,
  initializeDisplayCodeCounterFromDb,
} from "../factories";

// ── Setup ─────────────────────────────────────────────────────────
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// ── Configuration ─────────────────────────────────────────────────
const NUM_ORDERS = 500;
const MAX_ITEMS_PER_ORDER = 6;
const TIME_WINDOW_HOURS = 2; // 2 hours before and after

// ── Helpers ───────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickN<T>(arr: T[], min: number, max: number): T[] {
  const count = faker.number.int({ min, max: Math.min(max, arr.length) });
  return faker.helpers.arrayElements(arr, count);
}

/**
 * Generate a random date within the time window
 * @param now Current time
 * @param hoursOffset Number of hours before/after to distribute
 * @returns Random date within the window
 */
function generateRandomDateInWindow(now: Date, hoursOffset: number): Date {
  const beforeMs = hoursOffset * 60 * 60 * 1000;
  const afterMs = hoursOffset * 60 * 60 * 1000;

  const minTime = now.getTime() - beforeMs;
  const maxTime = now.getTime() + afterMs;
  const randomTime = faker.number.int({ min: minTime, max: maxTime });

  return new Date(randomTime);
}

// ── Main Seed Function ────────────────────────────────────────────
async function seedOrders() {
  console.log("[INFO] Starting orders seed...\n");

  const now = new Date();
  const timeWindowStart = new Date(now.getTime() - TIME_WINDOW_HOURS * 60 * 60 * 1000);
  const timeWindowEnd = new Date(now.getTime() + TIME_WINDOW_HOURS * 60 * 60 * 1000);

  console.log("[INFO] Time window for orders:");
  console.log(`  From: ${timeWindowStart.toISOString()}`);
  console.log(`  To:   ${timeWindowEnd.toISOString()}`);
  console.log("");

  // ────────────────────────────────────────────────────────────────
  // 1. Initialize display code counter from last order in DB
  // ────────────────────────────────────────────────────────────────
  console.log("[INFO] Initializing display code counter from database...");
  await initializeDisplayCodeCounterFromDb(prisma);
  console.log("[DONE] Display code counter initialized\n");

  // ────────────────────────────────────────────────────────────────
  // 2. Retrieve existing foods (error if none)
  // ────────────────────────────────────────────────────────────────
  console.log("[INFO] Fetching existing foods...");
  const allFoods = await prisma.food.findMany({
    include: { category: true },
  });

  if (allFoods.length === 0) {
    console.error("[ERROR] No foods found in database. Please seed the database first.");
    process.exit(1);
  }

  console.log(`[DONE] Found ${allFoods.length} foods\n`);

  // ────────────────────────────────────────────────────────────────
  // 3. Retrieve users and cash registers (needed for confirmed orders)
  // ────────────────────────────────────────────────────────────────
  console.log("[INFO] Fetching users and cash registers...");
  const users = await prisma.user.findMany();
  const cashRegisters = await prisma.cashRegister.findMany();

  if (users.length === 0 || cashRegisters.length === 0) {
    console.error("[ERROR] No users or cash registers found. Please seed the database first.");
    process.exit(1);
  }

  console.log(`[DONE] Found ${users.length} users and ${cashRegisters.length} cash registers\n`);

  // ────────────────────────────────────────────────────────────────
  // 4. Generate orders
  // ────────────────────────────────────────────────────────────────
  console.log(`[INFO] Creating ${NUM_ORDERS} orders with items...`);

  const statuses = ["PENDING", "CONFIRMED", "COMPLETED", "PICKED_UP"] as const;
  let createdOrders = 0;

  for (let i = 0; i < NUM_ORDERS; i++) {
    // Pick random foods for this order (1–6 items)
    const orderFoods = pickN(allFoods, 1, MAX_ITEMS_PER_ORDER);

    // Calculate order items details
    const itemsData: {
      foodId: string;
      quantity: number;
      unitPrice: number;
      unitSurcharge: number;
      total: number;
      notes: string | null;
    }[] = [];

    let subTotal = 0;

    for (const food of orderFoods) {
      const qty = faker.number.int({ min: 1, max: 4 });
      const unitPrice = Number(food.price);
      const unitSurcharge = faker.helpers.maybe(
        () => parseFloat(faker.commerce.price({ min: 0.5, max: 2, dec: 2 })),
        { probability: 0.15 }
      ) ?? 0;
      const itemTotal = (unitPrice + unitSurcharge) * qty;
      subTotal += itemTotal;

      itemsData.push({
        foodId: food.id,
        quantity: qty,
        unitPrice,
        unitSurcharge,
        total: Math.round(itemTotal * 100) / 100,
        notes:
          faker.helpers.maybe(
            () => faker.lorem.sentence({ min: 2, max: 5 }),
            { probability: 0.15 }
          ) ?? null,
      });
    }

    subTotal = Math.round(subTotal * 100) / 100;
    const discount =
      faker.helpers.maybe(
        () => Math.round(faker.number.float({ min: 0.5, max: 5, fractionDigits: 2 }) * 100) / 100,
        { probability: 0.1 }
      ) ?? 0;
    const surcharge = 0;
    const total = Math.round(Math.max(subTotal - discount + surcharge, 0) * 100) / 100;
    const status = faker.helpers.arrayElement(statuses);

    // Generate random date within the time window
    const orderCreatedAt = generateRandomDateInWindow(now, TIME_WINDOW_HOURS);

    const order = await createOrder(prisma, {
      status,
      subTotal,
      discount,
      surcharge,
      total,
      userId: status !== "PENDING" ? pick(users).id : null,
      cashRegisterId: status !== "PENDING" ? pick(cashRegisters).id : null,
      createdAt: orderCreatedAt,
    });

    // Create order items
    for (const itemData of itemsData) {
      await createOrderItem(prisma, {
        orderId: order.id,
        foodId: itemData.foodId,
        quantity: itemData.quantity,
        unitPrice: itemData.unitPrice,
        unitSurcharge: itemData.unitSurcharge,
        total: itemData.total,
        notes: itemData.notes,
      });
    }

    createdOrders++;
    if (createdOrders % 50 === 0) {
      console.log(`[PROGRESS] ${createdOrders}/${NUM_ORDERS} orders created...`);
    }
  }
  console.log(`[DONE] ${createdOrders} orders with items created\n`);

  // ── Summary ─────────────────────────────────────────────────────
  console.log("---------------------------------------------------");
  console.log("[DONE] Orders seed completed successfully");
  console.log("---------------------------------------------------");
  console.log(`  Foods              ${allFoods.length}`);
  console.log(`  Users              ${users.length}`);
  console.log(`  Cash Registers     ${cashRegisters.length}`);
  console.log(`  Orders             ${createdOrders}`);
  console.log("---------------------------------------------------");
}

// ── Execute ───────────────────────────────────────────────────────
seedOrders()
  .catch((e) => {
    console.error("[ERROR] Orders seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
