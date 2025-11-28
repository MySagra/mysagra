import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { PrismaClient } from "../src/generated/prisma_client"
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
                    name: "admin"
                },
                {
                    name: "operator"
                }
            ]
        });
    }

    const adminRole = await prisma.role.findUnique({
        where: {
            name: 'admin'
        }
    })

    const userCount = await prisma.user.count();

    if (!userCount) {
        const hashedPassword = await hashPwd("admin");
        const adminUser = await prisma.user.create({
            data: {
                username: "admin",
                password: hashedPassword,
                roleId: adminRole?.id!
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

        const ingredient = await prisma.ingredient.create({
            data: {
                name: "Mozzarella"
            }
        })

        const printer = await prisma.printer.create({
            data: {
                name: "Pizzeria Printer",
                ip: "192.168.1.10",
                status: "ONLINE"
            }
        })

        await prisma.food.create({
            data: {
                name: "Margherita",
                price: 15.50,
                categoryId: category.id,
                foodIngredients: {
                    create: [
                        {
                            ingredientId: ingredient.id
                        }
                    ]
                },
                printerId: printer.id
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