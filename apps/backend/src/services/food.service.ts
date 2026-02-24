import prisma from "@/utils/prisma";

import { Prisma } from "@generated/prisma_client";
import { GetFoodsQueryParams, GetFoodQueryParams, CreateFoodInput, PatchFoodInput, UpdateFoodInput } from "@/schemas";
import { EventService } from "./event.service";

const foodWithIngredientsInclude = {
    category: true,
    foodIngredients: {
        include: {
            ingredient: true,
        },
    },
} satisfies Prisma.FoodInclude

type FoodWithIngredients = Prisma.FoodGetPayload<{
    include: typeof foodWithIngredientsInclude;
}>;

export class FoodService {
    private event = EventService.getIstance('cashier')

    public static formatFoodResponse(food: FoodWithIngredients) {
        const { foodIngredients, ...restOfFood } = food;
        const ingredients = foodIngredients.map(fi => fi.ingredient);
        return {
            ...restOfFood,
            ingredients
        };
    }

    async getFoods(queryParams: GetFoodsQueryParams) {
        const whereClause: Prisma.FoodWhereInput = {}

        if (queryParams.available !== undefined) {
            whereClause.available = queryParams.available
        }

        if (queryParams.category) {
            whereClause.category = {
                name: {
                    in: queryParams.category
                }
            }
        }

        const foods = await prisma.food.findMany({
            where: whereClause,
            include: {
                category: true,
                ...(queryParams.include === 'ingredients' && {
                    foodIngredients: {
                        include: {
                            ingredient: true
                        }
                    }
                })
            }
        });

        if (!foods) return null;

        if (queryParams.include === 'ingredients') {
            return foods.map(food => FoodService.formatFoodResponse(food as FoodWithIngredients));
        }

        return foods;
    }

    async getFoodById(id: string, queryParams: GetFoodQueryParams) {
        const { include } = queryParams;
        const food = await prisma.food.findUnique({
            where: {
                id
            },
            include: {
                category: true,
                ...(include === 'ingredients' && {
                    foodIngredients: {
                        include: {
                            ingredient: true
                        }
                    }
                })
            }
        });

        if (!food) return null;

        if (include === 'ingredients') {
            return FoodService.formatFoodResponse(food as FoodWithIngredients);
        }

        return food;
    }

    async createFood(food: CreateFoodInput) {
        const newFood = await prisma.food.create({
            data: {
                ...food,
                ...(food.ingredients && food.ingredients.length > 0 && {
                    foodIngredients: {
                        create: food.ingredients.map(ingredient => ({
                            ingredientId: ingredient.id
                        }))
                    }
                })
            },
            include: {
                category: true,
                foodIngredients: {
                    include: {
                        ingredient: true
                    }
                }
            }
        });

        if (food.ingredients && food.ingredients.length > 0) {
            return FoodService.formatFoodResponse(newFood);
        }

        return newFood;
    }

    async updateFood(id: string, food: UpdateFoodInput) {
        // First delete existing ingredient relations
        await prisma.foodIngredient.deleteMany({
            where: {
                foodId: id
            }
        });

        // Then update the food and create new relations
        const updatedFood = await prisma.food.update({
            where: {
                id
            },
            data: {
                name: food.name,
                description: food.description,
                price: food.price,
                categoryId: food.categoryId,
                available: food.available,
                printerId: food.printerId,
                ...(food.ingredients && food.ingredients.length > 0 && {
                    foodIngredients: {
                        create: food.ingredients.map(ingredient => ({
                            ingredientId: ingredient.id
                        }))
                    }
                })
            },
            include: {
                category: true,
                foodIngredients: {
                    include: {
                        ingredient: true
                    }
                }
            }
        });

        if (food.ingredients && food.ingredients.length > 0) {
            return FoodService.formatFoodResponse(updatedFood);
        }

        return updatedFood;
    }

    async patchFood(id: string, food: PatchFoodInput) {
        const patchedFood = await prisma.food.update({
            where: {
                id
            },
            data: {
                printerId: food.printerId,
                available: food.available
            }
        })

        if (food.available) {
            this.event.broadcastEvent(
                {
                    id: patchedFood.id,
                    available: patchedFood.available
                },
                "food-availability-changed"
            )
        }

        return patchedFood;
    }

    async deleteFood(id: string) {
        return await prisma.food.delete({
            where: {
                id
            }
        })
    }
}
