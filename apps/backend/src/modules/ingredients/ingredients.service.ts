import { CreateIngredientInput, UpdateIngredientInput } from "@mysagra/schemas";
import { prisma } from "@mysagra/database";
import { NotFoundError } from "@/common/errors";

class IngredientsService {
    async getIngredients() {
        const ingredients = await prisma.ingredient.findMany();
        return ingredients;
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
        const created = await prisma.ingredient.create({
            data: ingredient
        })
        return created;
    }

    async updateIngredient(id: string, ingredient: UpdateIngredientInput) {
        const updated = await prisma.ingredient.update({
            where: {
                id
            },
            data: ingredient
        })
        return updated;
    }

    async deleteIngredient(id: string) {
        return await prisma.ingredient.delete({
            where: {
                id
            }
        })
    }
}

export const ingredientsService = new IngredientsService();
