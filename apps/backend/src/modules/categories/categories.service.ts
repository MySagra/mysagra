import {
    CreateCategoryInput,
    GetCategoriesQuery,
    GetCategoryQuery,
    PatchCategoryInput,
    PatchCategoryFoodsInput,
    ReorderCategoriesInput,
    UpdateCategoryInput
} from "@mysagra/schemas";
import { prisma, Prisma } from "@mysagra/database";
import { foodsService } from "../foods/foods.service";
import { ImagesService } from "../images/images.service";
import { EventsService } from "../events/events.service";
import { BadRequestError, NotFoundError } from "@/common/errors";

const categoriesOrderBy: Prisma.CategoryOrderByWithRelationInput[] = [
    { position: "asc" },
    { name: "asc" }
]

class CategoriesService {
    public readonly imageService = new ImagesService('categories', 'category');
    private event = EventsService.getInstance('cashier')

    async getCategories(queryParams?: GetCategoriesQuery) {
        if (!queryParams) {
            return await prisma.category.findMany({ orderBy: categoriesOrderBy });
        }

        const { available, include, foodsAvailable, hasStation } = queryParams;

        const whereClause: Prisma.CategoryWhereInput = { available }
        const categoriesInclude: Prisma.CategoryInclude = {};
        
        if(hasStation !== undefined) {
            if(hasStation){
                whereClause.stationId = { not: null }
            }
            else{ 
                whereClause.stationId = null 
            }
        }

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
            include: categoriesInclude,
            orderBy: categoriesOrderBy
        });

        if (include !== undefined) {
            return categories.map(category => ({
                ...category,
                foods: (category as any).foods.map((food: any) => {
                    if (include === "foods.ingredients") {
                        return foodsService.formatFoodResponse(food);
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
                        return foodsService.formatFoodResponse(food);
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
        return await prisma.$transaction(async (tx) => {
            let position = category.position;

            if (position === undefined) {
                const { _max } = await tx.category.aggregate({ _max: { position: true } });
                position = _max.position === null ? 0 : _max.position + 1;
            }

            return await tx.category.create({
                data: { ...category, position }
            })
        })
    }

    // Copies to the foods only the fields that changed: an edit of other fields (name, station...)
    // must not overwrite the availability or the printer set on a single food.
    private async propagateToFoods(
        tx: Prisma.TransactionClient,
        id: string,
        previous: { available: boolean; printerId: string | null },
        updated: { available: boolean; printerId: string | null }
    ) {
        const data: Prisma.FoodUncheckedUpdateManyInput = {};
        if (previous.available !== updated.available) data.available = updated.available;
        if (previous.printerId !== updated.printerId) data.printerId = updated.printerId;

        if (Object.keys(data).length > 0) {
            await tx.food.updateMany({ where: { categoryId: id }, data });
        }
    }

    async updateCategory(id: string, category: UpdateCategoryInput) {
        const { updatedCategory, availabilityChanged } = await prisma.$transaction(async (tx) => {
            const previous = await tx.category.findUnique({
                where: { id },
                select: { available: true, printerId: true }
            })

            if (!previous) {
                throw new NotFoundError("Category not found");
            }

            const updateCategory = await tx.category.update({
                where: {
                    id
                },
                data: category
            })

            await this.propagateToFoods(tx, id, previous, updateCategory);
            return {
                updatedCategory: updateCategory,
                availabilityChanged: previous.available !== updateCategory.available
            };
        })

        if (availabilityChanged) {
            this.event.broadcastEvent(
                {
                    id: updatedCategory.id,
                    available: updatedCategory.available
                },
                "category-availability-changed"
            )
        }

        return updatedCategory;
    }

    async patchCategory(id: string, category: PatchCategoryInput) {
        const patchedCategory = await prisma.$transaction(async (tx) => {
            const previous = await tx.category.findUnique({
                where: { id },
                select: { available: true, printerId: true }
            })

            if (!previous) {
                throw new NotFoundError("Category not found");
            }

            const patchCategory = await tx.category.update({
                where: {
                    id
                },
                data: category
            });

            await this.propagateToFoods(tx, id, previous, patchCategory);
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

    // Sets the flag on every food of the category: the category itself is not changed
    async patchCategoryFoods(id: string, { separateTicket }: PatchCategoryFoodsInput) {
        return await prisma.$transaction(async (tx) => {
            const category = await tx.category.findUnique({ where: { id }, select: { id: true } });
            if (!category) {
                throw new NotFoundError("Category not found");
            }

            await tx.food.updateMany({
                where: { categoryId: id },
                data: { separateTicket }
            });

            return await tx.food.findMany({
                where: { categoryId: id },
                orderBy: { name: "asc" }
            });
        });
    }

    async reorderCategories({ ids }: ReorderCategoriesInput) {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.category.findMany({ select: { id: true } });
            const existingIds = new Set(existing.map(c => c.id));

            if (ids.length !== existingIds.size || ids.some(id => !existingIds.has(id))) {
                throw new BadRequestError("Ids must contain every category exactly once");
            }

            for (const [position, id] of ids.entries()) {
                await tx.category.update({
                    where: { id },
                    data: { position }
                });
            }

            return await tx.category.findMany({ orderBy: categoriesOrderBy });
        });
    }

    async deleteCategory(id: string) {
        const category = await prisma.category.delete({
            where: { id }
        });

        if (category.image) {
            this.imageService.delete(category.image);
        }
    }

    async uploadImage(id: string, file: Express.Multer.File) {
        return await prisma.$transaction(async (tx) => {
            const category = await this.getCategoryById(id, undefined, tx);

            if (category?.image && (category.image !== file.filename)) {
                this.imageService.delete(category.image)
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

export const categoriesService = new CategoriesService();
