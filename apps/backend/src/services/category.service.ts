import prisma from "@/utils/prisma";
import { deleteFile, getUploadsPath } from "@/utils/fileManager";
import { Category, GetCategoriesQuery, GetCategoryQuery, PatchCategory } from "@/schemas";
import { Prisma } from "@generated/prisma_client";
import { FoodService } from "./food.service";

export class CategoryService {
    private static folderName = 'categories'
    private static imagePath = getUploadsPath();

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

    async createCategory(category: Category) {
        return await prisma.category.create({
            data: category
        })
    }

    async updateCategory(id: string, category: Category) {
        return await prisma.category.update({
            where: {
                id
            },
            data: category
        })
    }

    async patchCategory(id: string, category: PatchCategory) {
        return await prisma.$transaction(async (tx) => {
            const patchCategory = await tx.category.update({
                where: {
                    id
                },
                data: category
            });

            await tx.food.updateMany({
                where: {
                    categoryId: patchCategory.id
                },
                data: {
                    available: patchCategory.available
                }
            })
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
            deleteFile(CategoryService.getImagePath(), category.image)
        }

        return null;
    }

    async uploadImage(id: string, file: Express.Multer.File) {
        return await prisma.$transaction(async (tx) => {
            const category = await this.getCategoryById(id, undefined, tx);

            if (category?.image && (category.image !== file.filename)) {
                deleteFile(CategoryService.getImagePath(), category.image)
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

    static getImagePath() {
        return `${this.imagePath}/${this.folderName}`
    }
}