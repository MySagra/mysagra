import { CreateIngredientInput, UpdateIngredientInput } from "@/schemas";
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

    async createIngredient(ingredient: CreateIngredientInput) {
        return await prisma.ingredient.create({
            data: ingredient
        })
    }

    async updateIngredient(id: string, ingredient: UpdateIngredientInput) {
        return await prisma.ingredient.update({
            where: {
                id
            },
            data: ingredient
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