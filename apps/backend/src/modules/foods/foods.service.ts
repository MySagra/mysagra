import { prisma, Prisma } from "@mysagra/database";
import {
    GetFoodsQueryParams,
    GetFoodQueryParams,
    CreateFoodInput,
    PatchFoodInput,
    UpdateFoodInput
} from "@mysagra/schemas";
import { EventsService } from "../events/events.service";
import { NotFoundError } from "@/common/errors";

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

export class FoodsService {
    private event = EventsService.getIstance('cashier')

    public static formatFoodResponse(food: FoodWithIngredients) {
        const { foodIngredients, ...restOfFood } = food;
        const ingredients = foodIngredients
            .map(fi => fi.ingredient)
            .filter(ingredient => ingredient != null);
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

        if (queryParams.include === 'ingredients') {
            return foods.map(food => FoodsService.formatFoodResponse(food as FoodWithIngredients));
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

        if (!food) {
            throw new NotFoundError("Food not found");
        }

        if (include === 'ingredients') {
            return FoodsService.formatFoodResponse(food as FoodWithIngredients);
        }

        return food;
    }

    async createFood(food: CreateFoodInput) {
        const { ingredients, ...foodData } = food;

        const res = await prisma.$transaction(async (tx) => {
            const newFood = await prisma.food.create({
                data: {
                    ...foodData,
                    ...(ingredients && ingredients.length > 0 && {
                        foodIngredients: {
                            create: ingredients.map(ingredient => ({
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

            let categoryUpdated = null;

            if (newFood.available === true) {
                const updateBatch = await tx.category.updateMany({
                    where: {
                        id: newFood.categoryId,
                        available: false
                    },
                    data: { available: true }
                });

                if (updateBatch.count > 0) {
                    categoryUpdated = {
                        id: newFood.categoryId,
                        available: true
                    };
                }
            }

            return { newFood, categoryUpdated };
        })

        const { newFood, categoryUpdated } = res;

        if (ingredients && ingredients.length > 0) {
            return FoodsService.formatFoodResponse(newFood);
        }

        if (categoryUpdated) {
            this.event.broadcastEvent(
                {
                    id: categoryUpdated.id,
                    available: categoryUpdated.available
                },
                "category-availability-changed"
            )
        }

        return newFood;
    }

    async updateFood(id: string, food: UpdateFoodInput) {
        const res = await prisma.$transaction(async (tx) => {
            // First delete existing ingredient relations
            await tx.foodIngredient.deleteMany({
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

            let categoryUpdated = null;

            if (updatedFood.available === true) {
                const updateBatch = await tx.category.updateMany({
                    where: {
                        id: updatedFood.categoryId,
                        available: false
                    },
                    data: { available: true }
                });

                if (updateBatch.count > 0) {
                    categoryUpdated = {
                        id: updatedFood.categoryId,
                        available: true
                    };
                }
            }

            return { updatedFood, categoryUpdated };
        })

        const { updatedFood, categoryUpdated } = res;

        if (food.ingredients && food.ingredients.length > 0) {
            return FoodsService.formatFoodResponse(updatedFood);
        }

        if (categoryUpdated) {
            this.event.broadcastEvent(
                {
                    id: categoryUpdated.id,
                    available: categoryUpdated.available
                },
                "category-availability-changed"
            )
        }

        // broadcast new available status
        this.event.broadcastEvent(
            {
                id: updatedFood.id,
                available: updatedFood.available
            },
            "food-availability-changed"
        )

        return updatedFood;
    }

    async patchFood(id: string, food: PatchFoodInput) {
        const res = await prisma.$transaction(async (tx) => {
            const patchedFood = await tx.food.update({
                where: {
                    id
                },
                data: {
                    printerId: food.printerId,
                    available: food.available,
                }
            })

            let categoryUpdated = null;

            if (patchedFood.available === true) {
                const updateBatch = await tx.category.updateMany({
                    where: {
                        id: patchedFood.categoryId,
                        available: false
                    },
                    data: { available: true }
                });

                if (updateBatch.count > 0) {
                    categoryUpdated = {
                        id: patchedFood.categoryId,
                        available: true
                    };
                }
            }

            return { patchedFood, categoryUpdated };
        })

        const { patchedFood, categoryUpdated } = res

        if (categoryUpdated) {
            this.event.broadcastEvent(
                {
                    id: categoryUpdated.id,
                    available: categoryUpdated.available
                },
                "category-availability-changed"
            )
        }

        if (food.available !== undefined) {
            this.event.broadcastEvent(
                {
                    id: patchedFood.id,
                    available: patchedFood.available
                },
                "food-availability-changed"
            )
        }

        return res;
    }

    async deleteFood(id: string) {
        return await prisma.food.delete({
            where: {
                id
            }
        })
    }
}
