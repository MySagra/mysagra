import prisma from "@/utils/prisma";
import { deleteFile, getUploadsPath } from "@/utils/fileManager";

export class CategoryService {
    private static folderName = 'categories'
    private static imagePath = getUploadsPath();

    async getCategories() {
        return await prisma.category.findMany();
    }

    async getCategoryById(id: number) {
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

    async createCategory(name: string, available = true, position: number) {
        return await prisma.category.create({
            data: {
                name,
                available,
                position
            }
        })
    }

    async updateCategory(id: number, name: string, available = true, position: number) {
        return await prisma.category.update({
            where: {
                id
            },
            data: {
                name,
                available,
                position
            }
        })
    }

    async patchAvailableCategory(id: number) {
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

    async deleteCategory(id: number) {
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

    async uploadImage(id: number, file: Express.Multer.File) {
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