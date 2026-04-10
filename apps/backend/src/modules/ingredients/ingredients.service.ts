import { CreateIngredientInput, UpdateIngredientInput } from "@mysagra/schemas";
import { prisma } from "@mysagra/database";
import { NotFoundError } from "@/common/errors";

export class IngredientsService {
    async getIngredients() {
        return await prisma.ingredient.findMany();
    }

    async getIngredientById(id: string) {
        const ingredient = await prisma.ingredient.findUnique({
            where: {
                id
            }
        });

        if (!ingredient) {
            throw new NotFoundError("Ingredient not found");
        }

        return ingredient;
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