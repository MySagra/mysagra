import { CreateIngredientInput, UpdateIngredientInput } from "@mysagra/schemas";
import { prisma, Prisma } from "@mysagra/database";
import { NotFoundError } from "@/common/errors";

type IngredientRecord = Prisma.IngredientGetPayload<{}>;

export class IngredientsService {
    // Decimal(10,2) columns are serialized as strings by the driver,
    // so convert them to numbers to match the response contract.
    public static serializeIngredient(ingredient: IngredientRecord) {
        return {
            ...ingredient,
            surcharge: ingredient.surcharge.toNumber(),
        };
    }

    async getIngredients() {
        const ingredients = await prisma.ingredient.findMany();
        return ingredients.map(IngredientsService.serializeIngredient);
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

        return IngredientsService.serializeIngredient(ingredient);
    }

    async createIngredient(ingredient: CreateIngredientInput) {
        const created = await prisma.ingredient.create({
            data: ingredient
        })
        return IngredientsService.serializeIngredient(created);
    }

    async updateIngredient(id: string, ingredient: UpdateIngredientInput) {
        const updated = await prisma.ingredient.update({
            where: {
                id
            },
            data: ingredient
        })
        return IngredientsService.serializeIngredient(updated);
    }

    async deleteIngredient(id: string) {
        return await prisma.ingredient.delete({
            where: {
                id
            }
        })
    }
}