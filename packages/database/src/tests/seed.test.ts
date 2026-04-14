/**
 * Seed Test – Populates the database with all Swagger-described resources
 * and generates 250 orders using Faker.
 *
 * Run with: tsx src/tests/seed.test.ts
 */
import "dotenv/config";

import { faker } from "@faker-js/faker";
import { PrismaClient } from "../generated/prisma_client/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import {
  ensureDefaultRoles,
  createUser,
  createPrinter,
  createCashRegister,
  createCategory,
  createIngredient,
  createFood,
  createOrder,
  createOrderItem,
  createBanner,
  createOrderInstruction,
  createApiKey,
  initializeDisplayCodeCounterFromDb,
} from "../factories";

// ── Setup ─────────────────────────────────────────────────────────
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// ── Configuration ─────────────────────────────────────────────────
const NUM_PRINTERS = 4;
const NUM_CATEGORIES = 6;
const NUM_INGREDIENTS = 15;
const NUM_FOODS_PER_CATEGORY = 5; // = 30 foods total
const NUM_CASH_REGISTERS = 3;
const NUM_USERS = 5;
const NUM_BANNERS = 4;
const NUM_ORDER_INSTRUCTIONS = 3;
const NUM_API_KEYS = 2;
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
async function seed() {
  console.log("[INFO] Starting database seed...\n");

  // ----------------------------------------------------------------
  // 0. Cleanup — delete all existing data (respecting FK order)
  // ----------------------------------------------------------------
  console.log("[INFO] Cleaning up existing data...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.foodIngredient.deleteMany();
  await prisma.food.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.category.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.printer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.orderInstruction.deleteMany();
  await prisma.foodStats.deleteMany();
  await prisma.categoryStats.deleteMany();
  await prisma.report.deleteMany();
  // Roles are upserted, no need to delete
  console.log("[DONE] Database cleaned\n");

  // ----------------------------------------------------------------
  // 1. Roles
  // ----------------------------------------------------------------
  console.log("[INFO] Creating roles...");
  const roles = await ensureDefaultRoles(prisma);
  const roleList = Object.values(roles);
  console.log(`[DONE] ${roleList.length} roles ready\n`);

  // ----------------------------------------------------------------
  // 2. Printers
  // ----------------------------------------------------------------
  console.log("[INFO] Creating printers...");
  const printers = [];
  for (let i = 0; i < NUM_PRINTERS; i++) {
    printers.push(await createPrinter(prisma));
  }
  console.log(`[DONE] ${printers.length} printers created\n`);

  // ----------------------------------------------------------------
  // 3. Categories
  // ----------------------------------------------------------------
  console.log("[INFO] Creating categories...");
  const categories = [];
  const categoryNames = [
    "Pizzeria",
    "Grigliata",
    "Friggitoria",
    "Pasta",
    "Dolci",
    "Bevande",
  ];
  for (let i = 0; i < NUM_CATEGORIES; i++) {
    categories.push(
      await createCategory(prisma, {
        name: categoryNames[i],
        position: i,
        printerId: pick(printers).id,
        available: true,
      })
    );
  }
  console.log(`[DONE] ${categories.length} categories created\n`);

  // ----------------------------------------------------------------
  // 4. Ingredients
  // ----------------------------------------------------------------
  console.log("[INFO] Creating ingredients...");
  const ingredientNames = [
    "Mozzarella",
    "Pomodoro",
    "Basilico",
    "Prosciutto cotto",
    "Funghi champignon",
    "Salsiccia",
    "Peperoni",
    "Olive nere",
    "Cipolla",
    "Aglio",
    "Parmigiano",
    "Gorgonzola",
    "Ricotta fresca",
    "Rucola",
    "Melanzane",
  ];
  const ingredients = [];
  for (let i = 0; i < NUM_INGREDIENTS; i++) {
    ingredients.push(
      await createIngredient(prisma, { name: ingredientNames[i] })
    );
  }
  console.log(`[DONE] ${ingredients.length} ingredients created\n`);

  // ----------------------------------------------------------------
  // 5. Foods (with ingredients)
  // ----------------------------------------------------------------
  console.log("[INFO] Creating foods...");
  const allFoods: Awaited<ReturnType<typeof createFood>>[] = [];

  const foodsByCategory: Record<string, string[][]> = {
    Pizzeria: [
      ["Margherita", "Mozzarella", "Pomodoro", "Basilico"],
      ["Diavola", "Mozzarella", "Pomodoro", "Salsiccia", "Peperoni"],
      ["Quattro Formaggi", "Mozzarella", "Gorgonzola", "Parmigiano", "Ricotta fresca"],
      ["Capricciosa", "Mozzarella", "Pomodoro", "Prosciutto cotto", "Funghi champignon", "Olive nere"],
      ["Marinara", "Pomodoro", "Aglio", "Basilico"],
    ],
    Grigliata: [
      ["Arrosticini (x10)"],
      ["Salamella alla griglia"],
      ["Costine BBQ"],
      ["Spiedini misti"],
      ["Bistecca di manzo"],
    ],
    Friggitoria: [
      ["Patatine fritte"],
      ["Olive ascolane"],
      ["Supplì al telefono"],
      ["Arancini siciliani"],
      ["Frittura mista di pesce"],
    ],
    Pasta: [
      ["Pasta al ragù"],
      ["Lasagna della nonna"],
      ["Gnocchi al pomodoro", "Pomodoro", "Basilico"],
      ["Tagliatelle ai funghi", "Funghi champignon", "Parmigiano"],
      ["Penne all'arrabbiata", "Pomodoro", "Aglio", "Peperoni"],
    ],
    Dolci: [
      ["Tiramisù"],
      ["Panna cotta"],
      ["Crostata di frutta"],
      ["Cannoli siciliani", "Ricotta fresca"],
      ["Ciambella della sagra"],
    ],
    Bevande: [
      ["Birra media (0.4L)"],
      ["Coca Cola"],
      ["Acqua naturale (0.5L)"],
      ["Vino rosso (calice)"],
      ["Sprite"],
    ],
  };

  const ingredientMap = new Map(ingredients.map((i) => [i.name, i.id]));

  for (const cat of categories) {
    const foodDefs = foodsByCategory[cat.name] ?? [];
    for (const foodDef of foodDefs) {
      const [foodName, ...ingredientNamesList] = foodDef;
      const ingredientIds = ingredientNamesList
        .map((n) => ingredientMap.get(n))
        .filter(Boolean) as string[];

      allFoods.push(
        await createFood(prisma, {
          name: foodName,
          categoryId: cat.id,
          printerId: cat.printerId ?? pick(printers).id,
          ingredientIds,
          price: parseFloat(faker.commerce.price({ min: 2, max: 20, dec: 2 })),
        })
      );
    }
  }
  console.log(`[DONE] ${allFoods.length} foods created\n`);

  // ----------------------------------------------------------------
  // 6. Cash Registers
  // ----------------------------------------------------------------
  console.log("[INFO] Creating cash registers...");
  const cashRegisters = [];
  const crNames = ["Cassa Principale", "Cassa Bar", "Cassa Asporto"];
  for (let i = 0; i < NUM_CASH_REGISTERS; i++) {
    cashRegisters.push(
      await createCashRegister(prisma, {
        name: crNames[i],
        enabled: true,
        defaultPrinterId: pick(printers).id,
      })
    );
  }
  console.log(`[DONE] ${cashRegisters.length} cash registers created\n`);

  // ----------------------------------------------------------------
  // 7. Users
  // ----------------------------------------------------------------
  console.log("[INFO] Creating users...");
  const users = [];
  // Always create an admin
  users.push(
    await createUser(prisma, {
      username: "admin",
      password: "admin",
      roleId: roles.admin.id,
    })
  );
  for (let i = 1; i < NUM_USERS; i++) {
    users.push(
      await createUser(prisma, {
        roleId: pick(roleList).id,
      })
    );
  }
  console.log(`[DONE] ${users.length} users created\n`);

  // ----------------------------------------------------------------
  // 8. Banners
  // ----------------------------------------------------------------
  console.log("[INFO] Creating banners...");
  const banners = [];
  for (let i = 0; i < NUM_BANNERS; i++) {
    banners.push(await createBanner(prisma));
  }
  console.log(`[DONE] ${banners.length} banners created\n`);

  // ----------------------------------------------------------------
  // 9. Order Instructions
  // ----------------------------------------------------------------
  console.log("[INFO] Creating order instructions...");
  const instructionTexts = [
    "**Comunica il codice ordine** alla cassa e paga",
    "**Attendi il tuo numero** sul display",
    "**Ritira il tuo ordine** al bancone indicato sullo scontrino",
  ];
  const orderInstructions = [];
  for (let i = 0; i < NUM_ORDER_INSTRUCTIONS; i++) {
    orderInstructions.push(
      await createOrderInstruction(prisma, {
        text: instructionTexts[i],
        position: i,
      })
    );
  }
  console.log(`[DONE] ${orderInstructions.length} order instructions created\n`);

  // ----------------------------------------------------------------
  // 10. API Keys
  // ----------------------------------------------------------------
  console.log("[INFO] Creating API keys...");
  const apiKeys = [];
  apiKeys.push(await createApiKey(prisma, { name: "Printer Client", type: "PRINTER" }));
  apiKeys.push(await createApiKey(prisma, { name: "WebApp Client", type: "WEBAPP" }));
  console.log(`[DONE] ${apiKeys.length} API keys created\n`);

  // ----------------------------------------------------------------
  // 11. Orders (500) with OrderItems
  // ----------------------------------------------------------------
  console.log(`[INFO] Creating ${NUM_ORDERS} orders with items...`);
  console.log(`[INFO] Time window for orders:`);
  const now = new Date();
  const timeWindowStart = new Date(now.getTime() - TIME_WINDOW_HOURS * 60 * 60 * 1000);
  const timeWindowEnd = new Date(now.getTime() + TIME_WINDOW_HOURS * 60 * 60 * 1000);
  console.log(`  From: ${timeWindowStart.toISOString()}`);
  console.log(`  To:   ${timeWindowEnd.toISOString()}\n`);

  await initializeDisplayCodeCounterFromDb(prisma);

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
  console.log("[DONE] Seed completed successfully");
  console.log("---------------------------------------------------");
  console.log(`  Roles              ${roleList.length}`);
  console.log(`  Printers           ${printers.length}`);
  console.log(`  Categories         ${categories.length}`);
  console.log(`  Ingredients        ${ingredients.length}`);
  console.log(`  Foods              ${allFoods.length}`);
  console.log(`  Cash Registers     ${cashRegisters.length}`);
  console.log(`  Users              ${users.length}`);
  console.log(`  Banners            ${banners.length}`);
  console.log(`  Order Instructions ${orderInstructions.length}`);
  console.log(`  API Keys           ${apiKeys.length}`);
  console.log(`  Orders             ${createdOrders}`);
  console.log("---------------------------------------------------");
  console.log("");
  console.log("[INFO] Test credentials:");
  console.log("  Username: admin");
  console.log("  Password: admin");
  console.log("---------------------------------------------------");
}

// ── Execute ───────────────────────────────────────────────────────
seed()
  .catch((e) => {
    console.error("[ERROR] Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
