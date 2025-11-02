import prisma from "@/utils/prisma";

export class IngredientService {
    async getIngredients() {
        return await prisma.ingredient.findMany();
    }

    async getIngredientById(id: string) {
        return await prisma.ingredient.findUnique({
            where: {
                id
            }
        })
    }

    async createIngredient(name: string) {
        return await prisma.ingredient.create({
            data: {
                name
            }
        })
    }

    async updateIngredient(id: string, name: string) {
        return await prisma.ingredient.update({
            where: {
                id
            },
            data: {
                name
            }
        })
    }

    async deleteIngredient(id: string) {
        return await prisma.ingredient.delete({
            where: {
                id
            }
        })
    }
}