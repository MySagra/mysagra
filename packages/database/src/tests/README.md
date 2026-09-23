# Factories & Seed

This folder contains the factory functions used to generate test data. Each factory
(`createUser`, `createFood`, `createOrder`, ...) builds a single record via the Prisma
client. The seed scripts combine these factories to populate the database.

## Prerequisites

Before running any seed, make sure the environment is configured:

- A `.env` file with `DATABASE_URL` (and `PEPPER` for password hashing) is present.
- The database is migrated and the Prisma client is generated.

```bash
# Generate the Prisma client
pnpm --filter @mysagra/database generate

# Apply migrations
pnpm --filter @mysagra/database db:migrate
```

## Available seed commands

Run these from the repository root (they are defined in `packages/database/package.json`).

### Base seed

Creates the default roles and the initial admin user.

```bash
pnpm --filter @mysagra/database db:seed
# runs: tsx prisma/seed.ts
```

### Full test seed

Populates every resource described in Swagger (roles, users, printers, cash registers,
categories, ingredients, foods, banners, instructions, API keys) and generates ~250 orders
using Faker.

```bash
pnpm --filter @mysagra/database db:seed:test
# runs: tsx src/tests/seed.test.ts
```

### Orders seed

Generates 500 additional orders using the foods already present in the database.
The orders are spread over a time window from 2 hours before to 2 hours after run time.

```bash
pnpm --filter @mysagra/database db:seed:orders
# runs: tsx src/tests/seed.orders.ts
```

## Running from inside the package

If you `cd packages/database` you can drop the filter:

```bash
pnpm db:seed
pnpm db:seed:test
pnpm db:seed:orders
```

## Running a script directly

Any seed script can be launched directly with `tsx`:

```bash
tsx prisma/seed.ts
tsx src/tests/seed.test.ts
tsx src/tests/seed.orders.ts
```

## Tuning the generated volume

The test seeds expose configuration constants at the top of each file
(e.g. `NUM_USERS`, `NUM_CATEGORIES`, `NUM_ORDERS`, `MAX_ITEMS_PER_ORDER`).
Edit those values before running the script to change how much data is created.
