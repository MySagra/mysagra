import prisma from "@/utils/prisma";

import { Prisma } from "@generated/prisma_client";
import { FoodIngredient } from "@/schemas";

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
    private static _formatFoodResponse(food: FoodWithIngredients) {
        const { foodIngredients, ...restOfFood } = food;
        const ingredients = foodIngredients.map(fi => fi.ingredient);
        return {
            ...restOfFood,
            ingredients
        };
    }

    async getFoods(include?: string) {
        const foods = await prisma.food.findMany({
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

        if(!foods) return null;

        if(include === 'ingredients'){
            return foods.map(food => FoodService._formatFoodResponse(food as FoodWithIngredients));
        }

        return foods;
    }

    async getFoodById(id: string, include?: string) {
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

        if(!food) return null;

        if(include === 'ingredients'){
            return FoodService._formatFoodResponse(food as FoodWithIngredients);
        }

        return food;
    }

    async getAvailableFoods(include?: string) {
        const foods = await prisma.food.findMany({
            where: {
                available: true
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

        if(include === 'ingredients'){
            return foods.map(food => FoodService._formatFoodResponse(food as FoodWithIngredients));
        }

        return foods;
    }

    async getFoodsByCategoryId(categoryId: number, include?: string) {
        const foods = await prisma.food.findMany({
            where: {
                categoryId
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

        if(include === 'ingredients'){
            return foods.map(food => FoodService._formatFoodResponse(food as FoodWithIngredients));
        }

        return foods;
    }

    async getAvailableFoodsByCategoryId(categoryId: number, include?: string) {
        const foods = await prisma.food.findMany({
            where: {
                categoryId,
                available: true
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

        if(include === 'ingredients'){
            return foods.map(food => FoodService._formatFoodResponse(food as FoodWithIngredients));
        }

        return foods;
    }

    async createFood(name: string, description: string, price: number, categoryId: number, available = true, ingredients?: FoodIngredient[]) {
        const food = await prisma.food.create({
            data: {
                name,
                description,
                price,
                categoryId,
                available,
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

        if(ingredients && ingredients.length > 0){
            return FoodService._formatFoodResponse(food);
        }

        return food;
    }

    async updateFood(id: string, name: string, description: string, price: number, categoryId: number, available = true, ingredients?: FoodIngredient[]) {
        // First delete existing ingredient relations
        await prisma.foodIngredient.deleteMany({
            where: {
                foodId: id
            }
        });

        // Then update the food and create new relations
        const food = await prisma.food.update({
            where: {
                id
            },
            data: {
                name,
                description,
                price,
                categoryId,
                available,
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

        if(ingredients && ingredients.length > 0){
            return FoodService._formatFoodResponse(food);
        }

        return food;
    }

    async patchAvailableFood(id: string) {
        const food = await this.getFoodById(id);
        if (!food) return null;

        return await prisma.food.update({
            where: {
                id
            },
            data: {
                available: !food.available
            }
        })
    }

    async deleteFood(id: string) {
        return await prisma.food.delete({
            where: {
                id
            }
        })
    }
}
