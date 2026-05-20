import {
    CreateCategoryInput,
    GetCategoriesQuery,
    GetCategoryQuery,
    PatchCategoryInput,
    UpdateCategoryInput
} from "@mysagra/schemas";
import { prisma, Prisma } from "@mysagra/database";
import { FoodsService } from "../foods/foods.service";
import { ImagesService } from "../images/images.service";
import { EventsService } from "../events/events.service";
import { NotFoundError } from "@/common/errors";

export class CategoriesService {
    public static imageService = new ImagesService('categories', 'category');
    private event = EventsService.getInstance('cashier')

    async getCategories(queryParams?: GetCategoriesQuery) {
        if (!queryParams) {
            return await prisma.category.findMany();
        }

        const { available, include, foodsAvailable } = queryParams;

        const whereClause: Prisma.CategoryWhereInput = { available }
        const categoriesInclude: Prisma.CategoryInclude = {};

        if (include !== undefined) {
            categoriesInclude.foods = {
                where: { available: foodsAvailable },
                include: {
                    foodIngredients: include === "foods.ingredients" ? {
                        include: { ingredient: true }
                    } : false
                }
            }
        }

        const categories = await prisma.category.findMany({
            where: whereClause,
            include: categoriesInclude
        });

        if (include !== undefined) {
            return categories.map(category => ({
                ...category,
                foods: (category as any).foods.map((food: any) => {
                    if (include === "foods.ingredients") {
                        return FoodsService.formatFoodResponse(food);
                    }
                    // Escludi foodIngredients dal response se non richiesto
                    const { foodIngredients, ...foodData } = food;
                    return foodData;
                })
            }))
        }

        return categories;
    }

    async getCategoryById(id: string, queryParams?: GetCategoryQuery, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;

        if (!queryParams) {
            return await client.category.findUnique({
                where: { id }
            })
        }

        const { include } = queryParams
        const categoryInclude: Prisma.CategoryInclude = {}

        if (include !== undefined) {
            categoryInclude.foods = {
                include: {
                    foodIngredients: include === "foods.ingredients" ? {
                        include: { ingredient: true }
                    } : false
                }
            }
        }

        const category = await client.category.findUnique({
            where: {
                id,
            },
            include: categoryInclude
        })

        if (!category) {
            throw new NotFoundError("Category not found");
        }

        if (include !== undefined) {
            return {
                ...category,
                foods: (category as any).foods.map((food: any) => {
                    if (include === "foods.ingredients") {
                        return FoodsService.formatFoodResponse(food);
                    }
                    // Escludi foodIngredients dal response se non richiesto
                    const { foodIngredients, ...foodData } = food;
                    return foodData;
                })
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
        const updatedCategory = await prisma.$transaction(async (tx) => {
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

        this.event.broadcastEvent(
            {
                id: updatedCategory.id,
                available: updatedCategory.available
            },
            "category-availability-changed"
        )

        return updatedCategory;
    }

    async patchCategory(id: string, category: PatchCategoryInput) {
        const patchedCategory = await prisma.$transaction(async (tx) => {
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

        if (category.available !== undefined) {
            this.event.broadcastEvent(
                {
                    id: patchedCategory.id,
                    available: patchedCategory.available
                },
                "category-availability-changed"
            )
        }

        return patchedCategory;
    }

    async deleteCategory(id: string) {
        try {
            const category = await prisma.category.delete({
                where: {
                    id
                }
            });

            if (category.image) {
                CategoriesService.imageService.delete(category.image)
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async uploadImage(id: string, file: Express.Multer.File) {
        return await prisma.$transaction(async (tx) => {
            const category = await this.getCategoryById(id, undefined, tx);

            if (category?.image && (category.image !== file.filename)) {
                CategoriesService.imageService.delete(category.image)
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