import prisma from "@/utils/prisma";
import { CreateCategoryInput, GetCategoriesQuery, GetCategoryQuery, PatchCategoryInput, UpdateCategoryInput, UpdateFoodInput } from "@/schemas";
import { Prisma } from "@generated/prisma_client";
import { FoodService } from "./food.service";
import { ImageService } from "./image.service";

export class CategoryService {
    public static imageService = new ImageService('categories', 'category');

    async getCategories(queryParams?: GetCategoriesQuery) {
        const whereClause: Prisma.CategoryWhereInput = {}
        const include: Prisma.CategoryInclude = {}

        if (queryParams?.available !== undefined) {
            whereClause.available = queryParams.available
        }

        if (queryParams?.include === "foods") {
            include.foods = {
                include: {
                    foodIngredients: {
                        include: {
                            ingredient: true
                        }
                    }
                }
            }
        }

        const categories = await prisma.category.findMany({
            where: whereClause,
            include
        });

        if (queryParams?.include === "foods") {
            return categories.map(category => ({
                ...category,
                foods: (category as any).foods.map((food: any) => FoodService.formatFoodResponse(food))
            }))
        }

        return categories;
    }

    async getCategoryById(id: string, queryParams?: GetCategoryQuery, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;
        const include: Prisma.CategoryInclude = {}

        if (queryParams?.include === "foods") {
            include.foods = {
                include: {
                    foodIngredients: {
                        include: {
                            ingredient: true
                        }
                    }
                }
            }
        }


        const category = await client.category.findUnique({
            where: {
                id,
            },
            include
        })

        if (!category) return null;

        if (queryParams?.include === "foods") {
            return {
                ...category,
                foods: (category as any).foods.map((food: any) => FoodService.formatFoodResponse(food))
            }
        }

        return category;
    }

    async createCategory(category: CreateCategoryInput) {
        return await prisma.category.create({
            data: category
        })
    }

    async updateCategory(id: string, category: UpdateCategoryInput) {
        return await prisma.$transaction(async (tx) => {
            const updateCategory = await tx.category.update({
                where: {
                    id
                },
                data: category
            })

            const foodUpdate: Prisma.FoodUpdateManyArgs = {
                where: {
                    categoryId: id,
                },
                data: {
                    available: category.available,
                    printerId: category.printerId
                }
            }
            await tx.food.updateMany(foodUpdate)
            return updateCategory;
        })
    }

    async patchCategory(id: string, category: PatchCategoryInput) {
        return await prisma.$transaction(async (tx) => {
            const patchCategory = await tx.category.update({
                where: {
                    id
                },
                data: category
            });

            const foodUpdate: Prisma.FoodUpdateManyArgs = {
                where: {
                    categoryId: id,
                },
                data: {
                    available: patchCategory.available,
                    printerId: patchCategory.printerId
                }
            }

            await tx.food.updateMany(foodUpdate)
            return patchCategory;
        })
    }

    async deleteCategory(id: string) {
        const category = await prisma.category.delete({
            where: {
                id
            }
        });

        if (category.image) {
            CategoryService.imageService.delete(category.image)
        }

        return null;
    }

    async uploadImage(id: string, file: Express.Multer.File) {
        return await prisma.$transaction(async (tx) => {
            const category = await this.getCategoryById(id, undefined, tx);

            if (category?.image && (category.image !== file.filename)) {
                CategoryService.imageService.delete(category.image)
            }

            return await tx.category.update({
                where: {
                    id
                },
                data: {
                    image: file.filename
                }
            })
        })

    }

}