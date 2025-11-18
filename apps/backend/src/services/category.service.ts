import prisma from "@/utils/prisma";
import { deleteFile, getUploadsPath } from "@/utils/fileManager";
import { Category } from "@/schemas";

export class CategoryService {
    private static folderName = 'categories'
    private static imagePath = getUploadsPath();

    async getCategories() {
        return await prisma.category.findMany();
    }

    async getCategoryById(id: string) {
        return await prisma.category.findUnique({
            where: {
                id
            }
        })
    }

    async getAvailableCategories() {
        return await prisma.category.findMany({
            where: {
                available: true
            }
        })
    }

    async getCategoryByName(name: string) {
        return await prisma.category.findUnique({
            where: {
                name
            }
        })
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

    async patchAvailableCategory(id: string) {
        const category = await this.getCategoryById(id);
        if (!category) return null;

        return await prisma.category.update({
            where: {
                id
            },
            data: {
                available: !category.available
            }
        })
    }

    async deleteCategory(id: string) {
        const category =  await prisma.category.delete({
            where: {
                id
            }
        });

        if(category.image){
            deleteFile(CategoryService.getImagePath(), category.image)
        }

        return null;
    }

    async uploadImage(id: string, file: Express.Multer.File) {
        const category = await this.getCategoryById(id);

        if(category?.image && (category.image !== file.filename)){
            deleteFile(CategoryService.getImagePath(), category.image)
        }

        return await prisma.category.update({
            where: {
                id
            },
            data: {
                image: file.filename
            }
        })
    }

    static getImagePath(){
        return `${this.imagePath}/${this.folderName}`
    }
}