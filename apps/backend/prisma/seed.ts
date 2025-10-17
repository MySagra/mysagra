import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { PrismaClient } from "../generated/prisma_client/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";

const PEPPER = process.env.PEPPER;

export default async function hashPwd(password: string): Promise<string> {
    if (!PEPPER) {
        throw new Error("PEPPER not set")
    }
    const saltRounds = 10;
    const hash = await bcrypt.hash(password + PEPPER, saltRounds);
    return hash;
}

async function main() {
    const rolesCount = await prisma.role.count();

    if (!rolesCount) {
        await prisma.role.createMany({
            data: [
                {
                    id: 1,
                    name: "admin"
                },
                {
                    id: 2,
                    name: "operator"
                }
            ]
        });
    }

    const userCount = await prisma.user.count();

    if (!userCount) {
        const hashedPassword = await hashPwd("admin");
        const adminUser = await prisma.user.create({
            data: {
                username: "admin",
                password: hashedPassword,
                roleId: 1
            }
        });

        console.log("Production seeding completed", adminUser);
    }
    else {
        console.log("Production seeding skipped");
    }

    if (!(await prisma.category.findFirst())) {
        const category = await prisma.category.create({
            data: {
                name: "Pizzeria"
            }
        })

        await prisma.food.create({
            data: {
                name: "Margherita",
                price: 15.50,
                categoryId: category.id
            }
        })
    }


}

main()
    .catch(e => {
        console.error("Error seeding production database", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });