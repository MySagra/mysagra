import prisma from "@/utils/prisma";

export class FoodService {
    async getFoods() {
        return await prisma.food.findMany();
    }

    async getFoodById(id: number) {
        return await prisma.food.findUnique({
            where: {
                id
            }
        })
    }

    async getAvailableFoods() {
        return await prisma.food.findMany({
            where: {
                available: true
            }
        })
    }

    async getFoodsByCategoryId(categoryId: number) {
        return await prisma.food.findMany({
            where: {
                categoryId
            }
        })
    }

    async getAvailableFoodsByCategoryId(categoryId: number) {
        return await prisma.food.findMany({
            where: {
                categoryId,
                available: true
            }
        })
    }

    async createFood(name: string, description: string, price: number, categoryId: number, available = true) {
        return await prisma.food.create({
            data: {
                name,
                description,
                price,
                categoryId,
                available
            }
        })
    }

    async updateFood(id: number, name: string, description: string, price: number, categoryId: number, available = true) {
        return await prisma.food.update({
            where: {
                id
            },
            data: {
                name,
                description,
                price,
                categoryId,
                available
            }
        })
    }

    async patchAvailableFood(id: number) {
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

    async deleteFood(id: number) {
        return await prisma.food.delete({
            where: {
                id
            }
        })
    }
}
    