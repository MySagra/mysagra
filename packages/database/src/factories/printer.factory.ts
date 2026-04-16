import { faker } from "@faker-js/faker";
import type { PrismaClient } from "../generated/prisma_client/client";
import type { PrinterStatus } from "../generated/prisma_client/enums";

export interface CreatePrinterInput {
  name?: string;
  ip?: string | null;
  mac?: string | null;
  port?: number;
  description?: string;
  status?: PrinterStatus;
}

export async function createPrinter(
  prisma: PrismaClient,
  overrides: CreatePrinterInput = {}
) {
  return prisma.printer.create({
    data: {
      name: overrides.name ?? `${faker.commerce.department()} Printer ${faker.string.alphanumeric(4)}`,
      ip: overrides.ip !== undefined ? overrides.ip : faker.internet.ipv4(),
      mac:
        overrides.mac !== undefined
          ? overrides.mac
          : faker.internet.mac({ separator: ":" }),
      port: overrides.port ?? 9100,
      description:
        overrides.description ??
        faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.6 }) ??
        undefined,
      status: overrides.status ?? "ONLINE",
    },
  });
}
