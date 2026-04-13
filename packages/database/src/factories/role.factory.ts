import { faker } from "@faker-js/faker";
import type { PrismaClient } from "../generated/prisma_client/client";

const ROLE_NAMES = ["admin", "operator", "maintainer"] as const;

export async function createRole(
  prisma: PrismaClient,
  overrides: { name?: string } = {}
) {
  const name = overrides.name ?? faker.helpers.arrayElement([...ROLE_NAMES]);

  return prisma.role.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

/**
 * Ensures all default roles exist and returns them as a map.
 */
export async function ensureDefaultRoles(prisma: PrismaClient) {
  const roles: Record<string, Awaited<ReturnType<typeof createRole>>> = {};
  for (const name of ROLE_NAMES) {
    roles[name] = await createRole(prisma, { name });
  }
  return roles;
}
