import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import type { PrismaClient } from "../generated/prisma_client/client";

export interface CreateUserInput {
  username?: string;
  password?: string;
  roleId: string;
}

export async function createUser(
  prisma: PrismaClient,
  input: CreateUserInput
) {
  const username =
    input.username ?? faker.internet.username().toLowerCase().slice(0, 20);
  const plainPassword = input.password ?? "Test1234!";
  const pepper = process.env.PEPPER ?? "test_pepper";
  const hashedPassword = await bcrypt.hash(plainPassword + pepper, 10);

  return prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      roleId: input.roleId,
    },
  });
}
