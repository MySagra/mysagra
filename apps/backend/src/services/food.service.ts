import prisma from "@/utils/prisma";

import { FoodIngredient } from "@/validators";

export class FoodService {
    async getFoods() {
        return await prisma.food.findMany({
            include: {
                category: true,
                foodIngredients: {
                    select: {
                        ingredient: true
                    }
                }
            }
        });
    }

    async getFoodById(id: string) {
        return await prisma.food.findUnique({
            where: {
                id
            },
            include: {
                category: true,
                foodIngredients: {
                    select: {
                        ingredient: true
                    }
                }
            }
        })
    }

    async getAvailableFoods() {
        return await prisma.food.findMany({
            where: {
                available: true
            },
            include: {
                category: true,
                foodIngredients: {
                    select: {
                        ingredient: true
                    }
                }
            }
        })
    }

    async getFoodsByCategoryId(categoryId: number) {
        return await prisma.food.findMany({
            where: {
                categoryId
            },
            include: {
                category: true,
                foodIngredients: {
                    select: {
                        ingredient: true
                    }
                }
            }
        })
    }

    async getAvailableFoodsByCategoryId(categoryId: number) {
        return await prisma.food.findMany({
            where: {
                categoryId,
                available: true
            },
            include: {
                category: true,
                foodIngredients: {
                    select: {
                        ingredient: true
                    }
                }
            }
        })
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
                    select: {
                        ingredient: true
                    }
                }
            }
        })

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
        return await prisma.food.update({
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
                    select: {
                        ingredient: true
                    }
                }
            }
        })
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
